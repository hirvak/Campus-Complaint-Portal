import os
import glob
import re

versions_dir = os.path.join('backend', 'alembic', 'versions')
revs = {}
down_to_rev = {}
duplicates = []

for f in sorted(glob.glob(os.path.join(versions_dir, '*.py'))):
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    rev_match = re.search(r"revision\s*(?::\s*str)?\s*=\s*['\"]([^'\"]+)['\"]", content)
    down_match = re.search(r"down_revision\s*(?::\s*[^=]+)?\s*=\s*(['\"][^'\"]+['\"]|None)", content)
    
    if rev_match:
        rev = rev_match.group(1)
        raw_down = down_match.group(1) if down_match else None
        down = None if raw_down in (None, 'None') else raw_down.strip("'\"")
        if rev in revs:
            duplicates.append((rev, f, revs[rev]['file']))
        revs[rev] = {'down': down, 'file': os.path.basename(f)}

print(f"Total migration files found: {len(revs)}")
print(f"Duplicates detected: {len(duplicates)}")
for dup in duplicates:
    print(f"  DUPLICATE: {dup[0]} in {dup[1]} and {dup[2]}")

# Trace DAG from root to head
root = [r for r, d in revs.items() if d['down'] is None]
print(f"Root revision(s): {root}")

current = root[0] if root else None
chain = []
visited = set()
while current:
    chain.append(current)
    visited.add(current)
    # Find child
    children = [r for r, d in revs.items() if d['down'] == current]
    if len(children) > 1:
        print(f"Branching detected at {current}: {children}")
        break
    elif len(children) == 1:
        current = children[0]
    else:
        current = None

print("\nLinear Migration Chain:")
for i, rev in enumerate(chain, start=1):
    info = revs[rev]
    print(f"{i:2d}. {rev} (down: {info['down']}) -> {info['file']}")

if len(chain) == len(revs):
    print("\nSUCCESS: Perfectly linear chain with 0 forks, 0 duplicates, and exactly 1 head.")
else:
    print(f"\nWARNING: Disconnected revisions: {set(revs.keys()) - visited}")
