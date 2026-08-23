#!/usr/bin/env python3
"""Fetch the total citation count from OpenAlex and write it into index.md.

Run by .github/workflows/update-citations.yml on a schedule. Uses only the
standard library so the workflow doesn't need a dependency install step.

Previously this scraped the Google Scholar profile page directly, but Google
Scholar blocks requests from GitHub Actions' shared IP ranges (HTTP 403),
regardless of User-Agent. OpenAlex is a free, no-auth API intended for this
kind of programmatic access.
"""

import json
import re
import sys
import urllib.request

OPENALEX_AUTHOR_ID = "A5081121778"
OPENALEX_URL = f"https://api.openalex.org/authors/{OPENALEX_AUTHOR_ID}"
INDEX_MD = "index.md"
MARKER_START = "<!-- CITATION_COUNT_START -->"
MARKER_END = "<!-- CITATION_COUNT_END -->"

HEADERS = {"User-Agent": "samarth8392.github.io citation updater (+https://github.com/samarth8392/samarth8392.github.io)"}


def fetch_citation_count() -> int:
    request = urllib.request.Request(OPENALEX_URL, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)

    citation_count = data.get("cited_by_count")
    if citation_count is None:
        raise RuntimeError("OpenAlex response did not include cited_by_count")

    return int(citation_count)


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
