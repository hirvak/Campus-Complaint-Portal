import asyncio
import logging
import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.Database.session import SessionLocal
from app.Departments.models import Department
from app.Categories.models import Category
from app.Complaints.models import Complaint
from app.Users.models import User
from app.Notifications.models import Notification
from app.ComplaintHistory.models import ComplaintHistory
from app.SLA.models import SLAConfig, EscalationEvent
from app.SLA.service import check_and_escalate_overdue_complaints
from app.SLA.schemas import EscalationCheckResult

logger = logging.getLogger("sla_worker")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

DEFAULT_INTERVAL_SECONDS = int(os.getenv("SLA_CHECK_INTERVAL_SECONDS", "60"))


def run_sla_check_sync() -> EscalationCheckResult:
    """
    Synchronous worker tick executed in a dedicated worker thread pool.
    Opens and closes an isolated database session to prevent session leaks.
    """
    db = SessionLocal()
    try:
        return check_and_escalate_overdue_complaints(db=db, triggered_by_user=None)
    finally:
        db.close()


class SLAWorker:
    """
    Background worker for automatic, periodic SLA deadline monitoring and escalations.
    
    Architectural Safeguards:
      1. Concurrency: Uses with_for_update(skip_locked=True) in SQL queries to prevent
         race conditions and duplicate processing across multiple backend replicas.
      2. Event Loop Non-blocking: Offloads synchronous SQLAlchemy database operations
         to a worker thread via asyncio.to_thread.
      3. Fault Tolerance: Catches transient database and network exceptions, logging them
         without terminating the background monitoring loop.
      4. Graceful Shutdown: Listens to an asyncio.Event; cleanly stops and releases all resources
         during application shutdown without leaking sessions or dangling coroutines.
      5. Singleton Management: Prevents accidental creation of duplicate concurrent worker tasks.
    """

    def __init__(self, interval_seconds: int = DEFAULT_INTERVAL_SECONDS):
        self.interval_seconds = max(1, interval_seconds)
        self._task: Optional[asyncio.Task] = None
        self._shutdown_event: Optional[asyncio.Event] = None
        self._last_run_time: Optional[datetime] = None
        self._last_result: Optional[EscalationCheckResult] = None
        self._run_count: int = 0
        self._escalated_total: int = 0
        self._error_count: int = 0
        self._consecutive_errors: int = 0

    @property
    def is_running(self) -> bool:
        return self._task is not None and not self._task.done()

    def get_status(self) -> Dict[str, Any]:
        """Returns runtime diagnostics for status inspection and testing."""
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "last_run_time": self._last_run_time,
            "run_count": self._run_count,
            "escalated_total": self._escalated_total,
            "error_count": self._error_count,
            "consecutive_errors": self._consecutive_errors,
            "last_result": self._last_result.model_dump() if self._last_result else None
        }

    async def _worker_loop(self):
        logger.info(f"SLA Background Monitor started (interval={self.interval_seconds}s)")
        
        while self._shutdown_event and not self._shutdown_event.is_set():
            try:
                # Offload synchronous database query to thread pool
                result = await asyncio.to_thread(run_sla_check_sync)
                
                self._last_run_time = datetime.now(timezone.utc)
                self._last_result = result
                self._run_count += 1
                self._escalated_total += result.escalated_count
                self._consecutive_errors = 0

                if result.escalated_count > 0:
                    logger.info(
                        f"SLA Monitor: detected {result.overdue_detected} overdue, "
                        f"escalated {result.escalated_count} complaint(s): {result.escalated_complaints}"
                    )
                else:
                    logger.debug("SLA Monitor: check complete; 0 overdue breaches.")

            except Exception as e:
                self._error_count += 1
                self._consecutive_errors += 1
                logger.error(
                    f"SLA Monitor encountered error during execution (attempt {self._consecutive_errors}): {e}",
                    exc_info=True
                )
                # Keep loop alive; transient failures (e.g. temporary DB restart) will not crash the monitor

            # Wait for next interval or immediate shutdown signal
            try:
                await asyncio.wait_for(
                    self._shutdown_event.wait(),
                    timeout=self.interval_seconds
                )
                # If wait completed without TimeoutError, shutdown_event was set
                break
            except asyncio.TimeoutError:
                # Normal interval timeout elapsed; proceed to next monitoring tick
                continue

        logger.info("SLA Background Monitor loop exited cleanly.")

    def start(self):
        """Starts the periodic SLA monitoring task."""
        if self.is_running:
            logger.warning("SLA Monitor is already running; skipping duplicate start.")
            return

        self._shutdown_event = asyncio.Event()
        self._task = asyncio.create_task(
            self._worker_loop(),
            name="sla_background_monitor"
        )
        logger.info("SLA Background Monitor task created.")

    async def stop(self):
        """Gracefully stops the SLA monitoring task."""
        if not self.is_running:
            return

        logger.info("Stopping SLA Background Monitor...")
        if self._shutdown_event:
            self._shutdown_event.set()

        if self._task:
            try:
                await asyncio.wait_for(self._task, timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning("SLA Monitor did not terminate within 5s timeout; cancelling...")
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
            finally:
                self._task = None
                self._shutdown_event = None
                logger.info("SLA Background Monitor stopped successfully.")


# Global singleton instance for application lifespan
sla_worker = SLAWorker()
