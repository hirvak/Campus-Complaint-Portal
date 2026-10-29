"""Add COMPLAINT_ESCALATED to notificationtype enum

Revision ID: a1b2c3d4e5f6
Revises: 9b2504848c76
Create Date: 2026-10-28 21:47:00.000000

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9b2504848c76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Dedicated single revision to guarantee the new enum value is committed
    # in PostgreSQL system catalog before any subsequent migrations or application
    # code attempt to use it.
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'COMPLAINT_ESCALATED'")


def downgrade() -> None:
    # In PostgreSQL, individual enum labels cannot be dropped with ALTER TYPE without
    # recreating the type. The label remains permitted in the PostgreSQL type catalog,
    # which is harmless to application functionality.
    pass
