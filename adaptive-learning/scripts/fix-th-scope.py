"""Add scope="col" to every <th> that lacks it.

All <th> elements in this codebase are column headers (they sit inside
<thead>). scope="col" helps screen readers associate data cells with
their headers even in simple tables. WCAG 1.3.1 best practice.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"

# Matches opening <th (with attributes or not) — but NOT if `scope=` is
# already on the same tag.
TH_PATTERN = re.compile(r"<th(?![^>]*\bscope=)(\s|>)")


def process_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    if "<th" not in text:
        return 0
    new_text, count = TH_PATTERN.subn(lambda m: f"<th scope=\"col\"{m.group(1)}", text)
    if count > 0:
        path.write_text(new_text, encoding="utf-8")
    return count


def main() -> int:
    grand = 0
    files_changed = 0
    for path in sorted(ROOT.rglob("*.tsx")):
        n = process_file(path)
        if n:
            grand += n
            files_changed += 1
            print(f"  {n:3d}  {path.relative_to(ROOT)}")
    print(f"\nDone. Added scope=\"col\" to {grand} <th> elements across {files_changed} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
