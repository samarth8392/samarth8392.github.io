#!/usr/bin/env python3
"""Prebuild publication data and citation metrics for the website.

Run by .github/workflows/update-citations.yml on a schedule and whenever
_data/pub_list.yml changes. Writes two files that Jekyll reads at build
time, so visitors never wait on (or break because of) third-party APIs:

  _data/publications.json  per-paper metadata, abstract, authorships, citations
  _data/metrics.json       author-level totals, h-index and per-year counts

Metadata comes from Crossref; authorships with institutions, abstracts (as a
fallback) and author-level metrics come from OpenAlex. Both are free, no-auth
APIs. Google Scholar blocks GitHub Actions' IP ranges, so it isn't used.

If a DOI can't be fetched, the previous entry for it is kept so a flaky API
never removes a paper from the site.
"""

import datetime
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

import yaml

OPENALEX_AUTHOR_ID = "A5081121778"
DOI_LIST = "_data/pub_list.yml"
PUBLICATIONS_JSON = "_data/publications.json"
METRICS_JSON = "_data/metrics.json"

HEADERS = {"User-Agent": "samarth8392.github.io publication updater (+https://github.com/samarth8392/samarth8392.github.io)"}

PREPRINT_DOI_PREFIXES = ("10.1101/", "10.21203/", "10.22541/", "10.64898/")
# Preprint servers whose Crossref records name the publisher instead of the server.
PREPRINT_SERVERS = {"10.22541/": "Authorea", "10.21203/": "Research Square"}

# Where Samarth was when a paper was written, used to colour the co-author
# network. Matched against his own affiliation on each paper.
ERA_PATTERNS = [
    ("NCI", re.compile(r"national cancer institute|frederick national|national institutes of health|center for cancer research|leidos", re.I)),
    ("OSU", re.compile(r"ohio state", re.I)),
    ("Purdue", re.compile(r"purdue", re.I)),
    ("IITR", re.compile(r"roorkee", re.I)),
]


def get_json(url: str, retries: int = 3):
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.load(response)
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
            if attempt == retries - 1:
                raise
        except (urllib.error.URLError, TimeoutError):
            if attempt == retries - 1:
                raise
        time.sleep(2 ** attempt)
    return None


def clean_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text)
    text = re.sub(r"^\s*(abstract|summary)\s*", "", text, flags=re.I)
    return re.sub(r"\s+", " ", text).strip()


def abstract_from_inverted_index(index) -> str:
    if not index:
        return ""
    words = sorted((pos, word) for word, positions in index.items() for pos in positions)
    return " ".join(word for _, word in words)


def detect_kind(doi: str, crossref_type: str) -> str:
    if crossref_type == "posted-content" or doi.lower().startswith(PREPRINT_DOI_PREFIXES):
        return "preprint"
    return "article"


def detect_era(authorships, year: int) -> str:
    for authorship in authorships:
        if authorship["id"] != OPENALEX_AUTHOR_ID and "mathur" not in authorship["name"].lower():
            continue
        affiliations = " ".join(authorship["institutions"])
        for era, pattern in ERA_PATTERNS:
            if pattern.search(affiliations):
                return era
    # No affiliation on record: fall back to where he was that year.
    if year <= 2015:
        return "IITR"
    if year <= 2021:
        return "Purdue"
    if year <= 2023:
        return "OSU"
    return "NCI"


def fetch_publication(entry: dict) -> dict:
    doi = str(entry["doi"]).strip()
    crossref = get_json(f"https://api.crossref.org/works/{urllib.parse.quote(doi)}")
    if not crossref:
        raise RuntimeError(f"Crossref has no record for {doi}")
    work = crossref["message"]
    openalex = get_json(f"https://api.openalex.org/works/doi:{doi}") or {}

    date_parts = (work.get("published") or work.get("issued") or {}).get("date-parts", [[None]])[0]
    year = date_parts[0] if date_parts else None
    month = date_parts[1] if len(date_parts) > 1 else None

    authorships = []
    for authorship in openalex.get("authorships", []):
        author = authorship.get("author") or {}
        authorships.append({
            "id": (author.get("id") or "").rsplit("/", 1)[-1],
            "name": author.get("display_name") or "",
            "institutions": [inst["display_name"] for inst in authorship.get("institutions", []) if inst.get("display_name")],
        })
    if not authorships:
        authorships = [
            {"id": "", "name": f"{a.get('given', '')} {a.get('family', '')}".strip() or a.get("name", ""), "institutions": []}
            for a in work.get("author", [])
        ]

    abstract = clean_text(work.get("abstract", "")) or abstract_from_inverted_index(openalex.get("abstract_inverted_index"))
    citations = max(work.get("is-referenced-by-count") or 0, openalex.get("cited_by_count") or 0)

    return {
        "doi": doi,
        "title": clean_text((work.get("title") or [""])[0]) or openalex.get("title") or doi,
        "authors": authorships,
        "journal": clean_text((work.get("container-title") or [""])[0])
        or work.get("institution", [{}])[0].get("name", "")
        or next((name for prefix, name in PREPRINT_SERVERS.items() if doi.startswith(prefix)), work.get("publisher", "")),
        "year": year,
        "month": month,
        "volume": work.get("volume", ""),
        "issue": work.get("issue", ""),
        "pages": work.get("page", "") or work.get("article-number", ""),
        "publisher": work.get("publisher", ""),
        "kind": entry.get("kind") or detect_kind(doi, work.get("type", "")),
        "citations": citations,
        "abstract": abstract,
        "era": detect_era(authorships, year or 0),
        "highlights": entry.get("highlights") or [],
    }


def fetch_metrics() -> dict:
    author = get_json(f"https://api.openalex.org/authors/{OPENALEX_AUTHOR_ID}")
    if not author or author.get("cited_by_count") is None:
        raise RuntimeError("OpenAlex response did not include cited_by_count")
    stats = author.get("summary_stats") or {}
    return {
        "citations": author["cited_by_count"],
        "h_index": stats.get("h_index"),
        "i10_index": stats.get("i10_index"),
        "citations_by_year": sorted(
            ({"year": row["year"], "citations": row["cited_by_count"]} for row in author.get("counts_by_year", [])),
            key=lambda row: row["year"],
        ),
    }


def load_json(path: str):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def write_json(path: str, data) -> bool:
    new_content = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
    try:
        with open(path, encoding="utf-8") as f:
            if f.read() == new_content:
                return False
    except FileNotFoundError:
        pass
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return True


def main() -> None:
    with open(DOI_LIST, encoding="utf-8") as f:
        entries = yaml.safe_load(f) or []

    previous = {p["doi"].lower(): p for p in (load_json(PUBLICATIONS_JSON) or [])}
    publications, failures = [], 0
    for entry in entries:
        doi = str(entry["doi"]).strip()
        try:
            publications.append(fetch_publication(entry))
            print(f"ok    {doi}")
        except Exception as exc:  # noqa: BLE001 - keep going, reuse the old entry
            failures += 1
            if doi.lower() in previous:
                old = previous[doi.lower()]
                old["highlights"] = entry.get("highlights") or []
                old["kind"] = entry.get("kind") or old.get("kind", "article")
                publications.append(old)
                print(f"stale {doi}: {exc}", file=sys.stderr)
            else:
                print(f"skip  {doi}: {exc}", file=sys.stderr)
        time.sleep(0.2)

    if failures == len(entries):
        raise RuntimeError("Every publication fetch failed; leaving data untouched")

    publications.sort(key=lambda p: (p.get("year") or 0, p.get("month") or 0), reverse=True)
    metrics = fetch_metrics()

    # The date only changes when the numbers do, so unchanged runs don't commit.
    old_metrics = load_json(METRICS_JSON) or {}
    old_numbers = {k: v for k, v in old_metrics.items() if k != "updated"}
    metrics["updated"] = old_metrics.get("updated") if old_numbers == metrics else datetime.date.today().isoformat()

    changed = write_json(PUBLICATIONS_JSON, publications)
    changed = write_json(METRICS_JSON, metrics) or changed
    print(f"{len(publications)} publications, {metrics['citations']} citations, h-index {metrics['h_index']}")
    print("Data updated" if changed else "No changes")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - surface any failure to the workflow log
        print(f"Failed to update publication data: {exc}", file=sys.stderr)
        sys.exit(1)
