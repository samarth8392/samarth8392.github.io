# Pubs page: interactive Year/Topic filters

## Context

`pubs.md` renders publication cards client-side: it fetches metadata for a
hardcoded list of DOIs from Crossref (`myDOIs`), sorts by year, and renders
one card per publication via `createPublicationCard()`. There's currently no
way to filter or browse by year or topic — just one long list.

Modeled loosely after the publications section of a reference site
(`mywebsite/index.html#publications`), which offers clickable year/topic
filter pills above its publication list. This design adapts that idea to
this site's existing Crossref-based data flow and Bootstrap-derived visual
style — not the reference site's dark/DNA theme, and without its sidebar
charts.

## Goals

- Let a visitor filter the publication list by **year** and by **topic**,
  using clickable pill buttons, combinable (AND) and toggleable (click an
  active pill again to clear that filter).
- Auto-derive topic tags per publication from its title/journal text — no
  manual per-DOI tagging required now or when new DOIs are added later.
- Match the current site's visual language (Bootstrap card style, existing
  accent colors), not the reference site's aesthetic.

## Non-goals

- No sidebar bar charts (publications-per-year / topic-distribution).
- No free-text search box.
- No change to the DOI list, Crossref fetching, retry logic, or citation
  count logic — those are unchanged.

## Design

### Topic tagging

A static keyword dictionary, `TOPIC_KEYWORDS`, maps topic label → array of
lowercase substrings:

```js
const TOPIC_KEYWORDS = {
  'Cancer & Oncology': ['cancer','tumor','tumour','oncolog','carcinoma','organoid','car t','chimeric antigen','immunotherap','liquid biopsy','ceramide','glioma','sarcoma','leukemia','biomarker'],
  'Population Genetics': ['population genetic','genetic diversity','genetic load','gene flow','heterozygosity','runs of homozygosity','inbreeding','genetic erosion','effective population size'],
  'Conservation Genomics': ['conservation','endanger','threatened species','assisted gene flow','wildlife','reintroduc'],
  'Evolutionary Biology': ['evolution','speciation','adaptive','selection','diversifying selection'],
  'Immunogenetics': ['immune','immunogenetic','mhc','major histocompatibility','disease response','pathogen'],
  'Genomics & Bioinformatics': ['genome','genomic','sequenc','microsatellite','chloroplast','assembly','comparative genome'],
  'Plant Science': ['juglandaceae','walnut','butternut','plant'],
  'Microbiology': ['pseudomonas','bacteri','microbial','bioremediation','metabolic'],
};
```

For each fetched publication, `extractTopics(pub)` lowercases
`${pub.title} ${pub.journal}` and returns every topic whose keyword list has
a substring match. If none match, the publication is tagged `['General
Biology']`. A publication can carry multiple topics (matches reference site
behavior).

This runs once, after all publications finish loading and are sorted (not
during progressive per-DOI rendering), so year/topic pill lists reflect the
complete, final data set.

### Filter state & UI

Module-level state:

```js
let pubFilterState = { year: 'all', topic: 'all' };
```

Two pill rows are (re)rendered into the DOM right before the publication
cards, inside `updateUI()`, only once loading is complete:

- **Year row**: `All` pill + one pill per distinct `pub.year` present,
  sorted descending. `data-year="<year>"`.
- **Topic row**: `All topics` pill + one pill per distinct topic present
  across all publications, each showing a count badge (e.g. `Cancer &
  Oncology 4`), sorted by count descending. `data-topic="<topic>"`.

Clicking a pill:
- If it's already the active filter for its row, reset that row's state to
  `'all'`.
- Otherwise, set that row's state to the pill's value.
- Re-apply the `active` class within that row and call `applyPubFilters()`.

Year and topic filters combine with AND logic.

### Card filtering mechanics

Each publication card gets `data-year="<year>"` and
`data-topics="<topic1>,<topic2>"` attributes when rendered (added inside
`createPublicationCard()` or the wrapping markup in `updateUI()`).

`applyPubFilters()` iterates existing `.publication-card` elements (no
re-render) and toggles `style.display = 'none'` based on whether the card's
`data-year`/`data-topics` match the current `pubFilterState`. If the
resulting visible count is 0, an existing/adjacent "no publications match"
message element is shown; otherwise hidden.

### Styling

New rules added to `assets/css/publications.css`:

- `.pub-filter-row` — flex row, `flex-wrap: wrap`, gap, margin-bottom.
- `.pub-filter-btn` — pill shape (`border-radius: 999px` or similar),
  neutral background/border by default.
- `.pub-filter-btn[data-year].active` — blue accent (`#007bff`), matching
  `.journal-name` / existing link color.
- `.pub-filter-btn[data-topic].active` — purple accent (`#6f42c1`),
  matching `.metrics-label`.
- `.pub-filter-btn .count` — muted, smaller, inline count badge.
- `.pub-no-results` — centered muted text/icon, hidden by default.
- Mobile: rows wrap naturally via flex-wrap; no separate breakpoint needed
  beyond existing `@media (max-width: 768px)` block if pill sizing needs
  adjustment.

## Files touched

- `pubs.md` — add `TOPIC_KEYWORDS`, `extractTopics()`, `pubFilterState`,
  filter-pill rendering, `applyPubFilters()`, and wiring into the existing
  `updateUI()` / `loadPublications()` flow.
- `assets/css/publications.css` — add the filter pill / no-results styles
  described above.

## Risks / open questions

- Keyword dictionary is a best-effort heuristic and may mis-tag or
  under-tag some publications (e.g. cross-disciplinary titles); acceptable
  per this site's small, human-curated DOI list — can be refined by editing
  `TOPIC_KEYWORDS` directly, no data migration needed.
- Progressive loading (cards appear one-by-one as DOIs resolve) means the
  filter pill rows are intentionally deferred until the full sorted list is
  ready, to avoid pill lists changing mid-load.
