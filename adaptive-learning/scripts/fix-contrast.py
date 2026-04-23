"""Upgrade bare text-gray-400 occurrences to text-gray-500 dark:text-gray-400.

text-gray-400 (#9CA3AF) on white = 2.84:1, failing WCAG AA (needs 4.5:1).
text-gray-500 (#6B7280) on white = 4.83:1, passing.

We want to keep the existing dark-mode color (gray-400 on gray-900 ~6.3:1 pass),
so only bare uses get upgraded; existing `dark:text-gray-400` is left alone.

Run once from adaptive-learning/: python scripts/fix-contrast.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "src"

# Matches "text-gray-400" NOT preceded by "dark:". We walk the file line-by-line
# and replace within className strings, preserving surrounding classes.
BARE_GRAY_400 = re.compile(r"(?<!dark:)(?<![\w-])text-gray-400(?![\w-])")


def already_paired(line: str, idx: int) -> bool:
    """Heuristic: if `dark:text-gray-400` appears anywhere on the same line,
    assume the author already picked the dark pair and skip upgrading bare
    uses on this line to avoid duplicate dark classes."""
    return "dark:text-gray-400" in line


def upgrade_line(line: str) -> tuple[str, int]:
    """Return (new_line, replacements_made)."""
    if "text-gray-400" not in line:
        return line, 0
    # If any bare match exists, replace it with the paired variant, unless the
    # paired class already exists on the line (then just upgrade the light
    # mode part to text-gray-500 — the dark part stays as-is).
    if "dark:text-gray-400" in line:
        # Replace only the bare uses with text-gray-500 (don't re-add dark:).
        new_line, n = BARE_GRAY_400.subn("text-gray-500", line)
    else:
        new_line, n = BARE_GRAY_400.subn("text-gray-500 dark:text-gray-400", line)
    return new_line, n


def process_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    if "text-gray-400" not in text:
        return 0
    out_lines = []
    total = 0
    for line in text.splitlines(keepends=True):
        new_line, n = upgrade_line(line)
        total += n
        out_lines.append(new_line)
    if total > 0:
        path.write_text("".join(out_lines), encoding="utf-8")
    return total


def main() -> int:
    grand = 0
    files_changed = 0
    for path in sorted(ROOT.rglob("*.tsx")):
        n = process_file(path)
        if n:
            grand += n
            files_changed += 1
            print(f"  {n:3d}  {path.relative_to(ROOT)}")
    print(f"\nDone. Upgraded {grand} occurrences across {files_changed} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
