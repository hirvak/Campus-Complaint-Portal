"""Add Smart SLA and Escalation System

Revision ID: e8a1d7f4c3b2
Revises: a1b2c3d4e5f6
Create Date: 2026-10-28 21:48:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e8a1d7f4c3b2'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -------------------------------------------------------------------------
    # 1. Create sla_configs table with strict CHECK constraints
    # Guarantees each rule is EITHER category-specific OR priority-specific.
    # Guarantees target_hours > warning_hours > 0.
    # Reuses existing PostgreSQL enum type 'complaintpriority' without recreation.
    # -------------------------------------------------------------------------
    priority_enum = postgresql.ENUM(
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
        name='complaintpriority',
        create_type=False
    )

    op.create_table(
        'sla_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('priority', priority_enum, nullable=True),
        sa.Column('target_hours', sa.Integer(), nullable=False),
        sa.Column('warning_hours', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.CheckConstraint(
            '(category_id IS NOT NULL AND priority IS NULL) OR (category_id IS NULL AND priority IS NOT NULL)',
            name='ck_sla_config_target'
        ),
        sa.CheckConstraint(
            'target_hours > 0 AND warning_hours > 0 AND warning_hours < target_hours',
            name='ck_sla_config_hours'
        ),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sla_configs_id'), 'sla_configs', ['id'], unique=False)
    
    # Partial unique indexes prevent duplicate configurations for the same category or priority
    op.create_index(
        'uq_sla_config_category',
        'sla_configs',
        ['category_id'],
        unique=True,
        postgresql_where=sa.text('category_id IS NOT NULL')
    )
    op.create_index(
        'uq_sla_config_priority',
        'sla_configs',
        ['priority'],
        unique=True,
        postgresql_where=sa.text('priority IS NOT NULL')
    )

    # -------------------------------------------------------------------------
    # 2. Create escalation_events table
    # Unique constraint on (complaint_id, sla_cycle, escalation_level):
    # - Strictly prevents duplicate escalation events within the same SLA cycle
    # - Supports multiple escalation cycles across reopens without deleting past events
    # -------------------------------------------------------------------------
    op.create_table(
        'escalation_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('complaint_id', sa.Integer(), nullable=False),
        sa.Column('sla_cycle', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('escalation_level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('escalated_to', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=False),
        sa.Column('escalated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['complaint_id'], ['complaints.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['escalated_to'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('complaint_id', 'sla_cycle', 'escalation_level', name='uq_complaint_cycle_escalation_level')
    )
    op.create_index(op.f('ix_escalation_events_id'), 'escalation_events', ['id'], unique=False)
    op.create_index(op.f('ix_escalation_events_complaint_id'), 'escalation_events', ['complaint_id'], unique=False)

    # -------------------------------------------------------------------------
    # 3. Add SLA columns to complaints table
    # - sla_deadline: Target resolution deadline
    # - is_escalated: Escalated flag for current cycle
    # - escalated_at: Timestamp of escalation in current cycle
    # - escalation_level: Current escalation level (0=none, 1=facility officer)
    # - is_grandfathered: Flag for pre-SLA historical records to avoid alert storms
    # - sla_cycle: Lifecycle cycle count (starts at 1, increments on reopen)
    # -------------------------------------------------------------------------
    op.add_column('complaints', sa.Column('sla_deadline', sa.DateTime(timezone=True), nullable=True))
    op.add_column('complaints', sa.Column('is_escalated', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('complaints', sa.Column('escalated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('complaints', sa.Column('escalation_level', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('complaints', sa.Column('is_grandfathered', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('complaints', sa.Column('sla_cycle', sa.Integer(), nullable=False, server_default='1'))

    op.create_index(op.f('ix_complaints_sla_deadline'), 'complaints', ['sla_deadline'], unique=False)
    op.create_index(op.f('ix_complaints_is_escalated'), 'complaints', ['is_escalated'], unique=False)

    # -------------------------------------------------------------------------
    # 4. Seed default SLA configurations
    # Priority targets
    # -------------------------------------------------------------------------
    op.execute("""
        INSERT INTO sla_configs (priority, target_hours, warning_hours, is_active)
        VALUES 
            ('CRITICAL', 4, 1, true),
            ('HIGH', 12, 2, true),
            ('MEDIUM', 24, 4, true),
            ('LOW', 48, 8, true);
    """)

    # Category-specific target specifically for Pipe Leakage / Water Leakage only
    # (Matches category "Pipe Leakage" with description "water pipe leakage";
    # does NOT match general "Water Supply Testing").
    op.execute("""
        INSERT INTO sla_configs (category_id, priority, target_hours, warning_hours, is_active)
        SELECT id, NULL, 4, 1, true FROM categories 
        WHERE LOWER(name) IN ('pipe leakage', 'water leakage');
    """)

    # -------------------------------------------------------------------------
    # 5. Populate deadlines for all existing complaints
    # Calculate sla_deadline based on applicable category target or priority target.
    # -------------------------------------------------------------------------
    op.execute("""
        UPDATE complaints c
        SET sla_deadline = COALESCE(c.created_at, NOW()) + INTERVAL '1 hour' * COALESCE(
            (SELECT sc.target_hours FROM sla_configs sc WHERE sc.category_id = c.category_id AND sc.is_active = true LIMIT 1),
            (SELECT sc.target_hours FROM sla_configs sc WHERE sc.priority = c.priority AND sc.is_active = true LIMIT 1),
            CASE c.priority
                WHEN 'CRITICAL' THEN 4
                WHEN 'HIGH' THEN 12
                WHEN 'MEDIUM' THEN 24
                WHEN 'LOW' THEN 48
                ELSE 24
            END
        )
        WHERE c.sla_deadline IS NULL;
    """)

    # -------------------------------------------------------------------------
    # 6. Grandfather historical overdue complaints
    # Mark old unresolved complaints whose deadline has already passed as
    # grandfathered. They will NOT be escalated by background workers, and
    # is_escalated remains FALSE without creating phantom escalation records.
    # -------------------------------------------------------------------------
    op.execute("""
        UPDATE complaints
        SET is_grandfathered = true
        WHERE status NOT IN ('RESOLVED', 'CLOSED')
          AND sla_deadline < NOW();
    """)


def downgrade() -> None:
    """
    WARNING: Running downgrade will permanently drop:
      - 'escalation_events' table and all escalation audit history across all cycles.
      - 'sla_configs' table and all custom SLA configurations.
      - 'sla_deadline', 'is_escalated', 'escalated_at', 'escalation_level', 'is_grandfathered',
        and 'sla_cycle' columns from the 'complaints' table.
    Downgrade should NEVER be executed automatically or in production without an independent database backup.
    """
    # 1. Drop indices and columns on complaints
    op.drop_index(op.f('ix_complaints_is_escalated'), table_name='complaints')
    op.drop_index(op.f('ix_complaints_sla_deadline'), table_name='complaints')
    op.drop_column('complaints', 'sla_cycle')
    op.drop_column('complaints', 'is_grandfathered')
    op.drop_column('complaints', 'escalation_level')
    op.drop_column('complaints', 'escalated_at')
    op.drop_column('complaints', 'is_escalated')
    op.drop_column('complaints', 'sla_deadline')

    # 2. Drop escalation_events table
    op.drop_index(op.f('ix_escalation_events_complaint_id'), table_name='escalation_events')
    op.drop_index(op.f('ix_escalation_events_id'), table_name='escalation_events')
    op.drop_table('escalation_events')

    # 3. Drop sla_configs table
    op.drop_index('uq_sla_config_priority', table_name='sla_configs')
    op.drop_index('uq_sla_config_category', table_name='sla_configs')
    op.drop_index(op.f('ix_sla_configs_id'), table_name='sla_configs')
    op.drop_table('sla_configs')
