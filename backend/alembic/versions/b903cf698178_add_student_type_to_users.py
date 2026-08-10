"""add student type to users

Revision ID: b903cf698178
Revises: 8b6444ff5594
Create Date: ...
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b903cf698178"
down_revision: Union[str, Sequence[str], None] = "8b6444ff5594"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    student_type_enum = postgresql.ENUM(
        "CAMPUS",
        "HOSTEL",
        name="studenttype"
    )

    student_type_enum.create(
        op.get_bind(),
        checkfirst=True
    )

    op.add_column(
        "users",
        sa.Column(
            "student_type",
            student_type_enum,
            nullable=True
        )
    )


def downgrade() -> None:

    op.drop_column(
        "users",
        "student_type"
    )

    student_type_enum = postgresql.ENUM(
        "CAMPUS",
        "HOSTEL",
        name="studenttype"
    )

    student_type_enum.drop(
        op.get_bind(),
        checkfirst=True
    )