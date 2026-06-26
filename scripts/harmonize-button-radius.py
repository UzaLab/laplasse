#!/usr/bin/env python3
"""Harmonise les boutons : rounded-* → rounded-full dans les TSX."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "apps/web/src"
ROUNDED = re.compile(r"\brounded-(?:xl|2xl|lg|md|sm)\b")
TAG_PATTERNS = [
    re.compile(r"<button\b[\s\S]*?>", re.IGNORECASE),
    re.compile(r"<input\b[\s\S]*?type=[\"'](?:submit|button|reset)[\"'][\s\S]*?>", re.IGNORECASE),
    re.compile(r"<Link\b[\s\S]*?>", re.IGNORECASE),
    re.compile(r"<a\b[\s\S]*?>", re.IGNORECASE),
]


def is_button_like_link(tag: str) -> bool:
    lower = tag.lower()
    if not lower.startswith(("<link", "<a")):
        return False
    if "data-btn" in lower or "btn-" in lower or 'className="btn' in tag:
        return True
    has_padding = any(x in tag for x in ("px-", "py-", "p-2", "p-3", "p-2.5", "p-4"))
    has_weight = any(x in tag for x in ("font-bold", "font-semibold", "font-extrabold"))
    has_bg = "bg-" in tag or "border-" in tag
    return has_padding and (has_weight or has_bg)


def fix_tag(tag: str) -> str:
    lower = tag.lower()
    if lower.startswith("<link") or lower.startswith("<a"):
        if not is_button_like_link(tag):
            return tag
    return ROUNDED.sub("rounded-full", tag)


def process_content(content: str) -> tuple[str, int]:
    count = 0

    def apply_pattern(text: str, pattern: re.Pattern[str]) -> str:
        nonlocal count

        def replacer(match: re.Match[str]) -> str:
            nonlocal count
            tag = match.group(0)
            fixed = fix_tag(tag)
            if fixed != tag:
                count += 1
            return fixed

        return pattern.sub(replacer, text)

    updated = content
    for pattern in TAG_PATTERNS:
        updated = apply_pattern(updated, pattern)
    return updated, count


def main() -> None:
    total_files = 0
    total_tags = 0
    for path in ROOT.rglob("*.tsx"):
        original = path.read_text(encoding="utf-8")
        updated, n = process_content(original)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            total_files += 1
            total_tags += n
            print(f"  {path.relative_to(ROOT.parent.parent.parent)} ({n} tags)")

    print(f"\nDone: {total_files} files, {total_tags} tags updated")


if __name__ == "__main__":
    main()
