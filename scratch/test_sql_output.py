import io
import os
import sys
import contextlib

sys.path.insert(0, os.path.abspath('backend'))
from alembic.config import Config
from alembic import command

cfg = Config('backend/alembic.ini')

buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    command.upgrade(cfg, '9b2504848c76:head', sql=True)

output = buf.getvalue()
print("SQL Output Length:", len(output))
print("First 300 chars:")
print(output[:300])
print("\nContains multiple BEGIN/COMMIT?")
print("BEGIN count:", output.count("BEGIN;"))
print("COMMIT count:", output.count("COMMIT;"))
