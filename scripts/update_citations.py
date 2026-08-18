#!/usr/bin/env python3
"""Fetch the total citation count from Google Scholar and write it into index.md.

Run by .github/workflows/update-citations.yml on a schedule. Uses only the
standard library so the workflow doesn't need a dependency install step.
"""

import re
import sys
import urllib.request

SCHOLAR_URL = "https://scholar.google.com/citations?user=kL0KaxQAAAAJ&hl=en"
INDEX_MD = "index.md"
MARKER_START = "<!-- CITATION_COUNT_START -->"
MARKER_END = "<!-- CITATION_COUNT_END -->"

# A browser-like User-Agent avoids Google Scholar serving a stripped-down
# response to obvious script traffic.
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def fetch_citation_count() -> int:
    request = urllib.request.Request(SCHOLAR_URL, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        html = response.read().decode("utf-8", errors="replace")

    # The profile's citation table renders each stat as
    # <td class="gsc_rsb_std">N</td>; the first one is all-time citations.
    matches = re.findall(r'class="gsc_rsb_std">(\d+)</td>', html)
    if not matches:
        raise RuntimeError("Could not find a citation count on the Scholar profile page")

    return int(matches[0])


def update_index_md(citation_count: int) -> bool:
    with open(INDEX_MD, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(
        re.escape(MARKER_START) + r'\s*<div class="stat-number">.*?</div>\s*' + re.escape(MARKER_END)
    )
    if not pattern.search(content):
        raise RuntimeError(f"Could not find citation markers in {INDEX_MD}")

    replacement = (
        f"{MARKER_START}\n"
        f'    <div class="stat-number">{citation_count}+</div>\n'
        f"    {MARKER_END}"
    )
    new_content = pattern.sub(replacement, content)

    if new_content == content:
        return False

    with open(INDEX_MD, "w", encoding="utf-8") as f:
        f.write(new_content)
    return True


def main() -> None:
    citation_count = fetch_citation_count()
    print(f"Fetched citation count: {citation_count}")

    if update_index_md(citation_count):
        print(f"Updated {INDEX_MD} to {citation_count}+ citations")
    else:
        print("Citation count unchanged; nothing to update")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - surface any failure to the workflow log
        print(f"Failed to update citation count: {exc}", file=sys.stderr)
        sys.exit(1)
