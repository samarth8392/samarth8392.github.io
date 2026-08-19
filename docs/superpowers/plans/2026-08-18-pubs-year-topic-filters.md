# Pubs Year/Topic Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clickable Year and Topic filter pills to `pubs.md` so visitors can narrow the publication list, auto-tagging each publication's topic from its title/journal text.

**Architecture:** Pure client-side JS already embedded in `pubs.md` (Jekyll page, no build step, no bundler). Extend the existing `updateUI()` render cycle: tag each publication with topics once its metadata is fetched, render two rows of toggleable pill buttons above the existing card list, and filter already-rendered cards by toggling `display` based on `data-year`/`data-topics` attributes — no framework, no new dependencies.

**Tech Stack:** Vanilla JS (ES2017+), Jekyll/Liquid page (`pubs.md`), existing `assets/css/publications.css`. No test framework exists in this repo (static Jekyll site, no `package.json`). Node.js (`node`, confirmed present at `/usr/local/bin/node`) is used only as a scratch tool to sanity-check pure JS logic during implementation — nothing under `node` is committed. The functional acceptance check for DOM/browser behavior is `bundle exec jekyll serve` plus manual verification in a browser, per step below.

## Global Constraints

- Do not change the DOI list (`myDOIs`), Crossref fetch/retry logic, or citation-count logic in `pubs.md` — out of scope per the design spec.
- No sidebar charts, no search box — out of scope per the design spec.
- Visual style must reuse this site's existing accent colors: `#007bff` (blue, year pills active state) and `#6f42c1` (purple, topic pills active state) — do not introduce new colors.
- Filter pill rows must only (re)build once loading is complete (`isLoading === false`), so they don't visibly shift while publications are still loading progressively.
- Reference design doc: `docs/superpowers/specs/2026-08-18-pubs-year-topic-filters-design.md`.

---

### Task 1: Topic-tagging logic

**Files:**
- Modify: `pubs.md` (insert after the `formatAuthors` function, before `createPublicationCard`, i.e. after line 198 / before line 200 of the current file)

**Interfaces:**
- Produces: `TOPIC_KEYWORDS` (object, topic label string → array of lowercase keyword substrings) and `extractTopics(pub)` (function, takes a publication object with `.title`/`.journal` string fields, returns a non-empty array of topic label strings). Task 2 calls `extractTopics(pub)` and reads `pub.topics`.

- [ ] **Step 1: Write a standalone scratch check for the tagging logic**

Create `/private/tmp/claude-501/-Users-batcomputer-Documents-GitHub-samarth8392-github-io/b7e18e01-7cbd-40cb-96dd-f1ee7959447e/scratchpad/check-topics.js` with:

```js
const TOPIC_KEYWORDS = {
    'Cancer & Oncology': ['cancer', 'tumor', 'tumour', 'oncolog', 'carcinoma', 'organoid', 'car t', 'chimeric antigen', 'immunotherap', 'liquid biopsy', 'ceramide', 'glioma', 'sarcoma', 'leukemia', 'biomarker'],
    'Population Genetics': ['population genetic', 'genetic diversity', 'genetic load', 'gene flow', 'heterozygosity', 'runs of homozygosity', 'inbreeding', 'genetic erosion', 'effective population size'],
    'Conservation Genomics': ['conservation', 'endanger', 'threatened species', 'assisted gene flow', 'wildlife', 'reintroduc'],
    'Evolutionary Biology': ['evolution', 'speciation', 'adaptive', 'selection', 'diversifying selection'],
    'Immunogenetics': ['immune', 'immunogenetic', 'mhc', 'major histocompatibility', 'disease response', 'pathogen'],
    'Genomics & Bioinformatics': ['genome', 'genomic', 'sequenc', 'microsatellite', 'chloroplast', 'assembly', 'comparative genome'],
    'Plant Science': ['juglandaceae', 'walnut', 'butternut', 'plant'],
    'Microbiology': ['pseudomonas', 'bacteri', 'microbial', 'bioremediation', 'metabolic'],
};

function extractTopics(pub) {
    const text = `${pub.title || ''} ${pub.journal || ''}`.toLowerCase();
    const topics = Object.keys(TOPIC_KEYWORDS).filter(topic =>
        TOPIC_KEYWORDS[topic].some(keyword => text.includes(keyword))
    );
    return topics.length > 0 ? topics : ['General Biology'];
}

const cases = [
    [{ title: 'Genetic load has potential in large populations', journal: 'Evolutionary Applications' }, ['Population Genetics']],
    [{ title: 'Functional genomic diversity is correlated with neutral diversity', journal: 'PNAS' }, ['Genomics & Bioinformatics']],
    [{ title: 'ENPP3 CAR T cells combined with immunotherapy', journal: 'JITC' }, ['Cancer & Oncology']],
    [{ title: 'A completely unrelated title about nothing matchable', journal: 'Journal X' }, ['General Biology']],
];

let failures = 0;
for (const [pub, expectedSubset] of cases) {
    const got = extractTopics(pub);
    const ok = expectedSubset.every(t => got.includes(t));
    console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(pub.title), '->', got);
    if (!ok) failures++;
}
process.exit(failures > 0 ? 1 : 0);
```

- [ ] **Step 2: Run it and confirm all cases pass**

Run: `node /private/tmp/claude-501/-Users-batcomputer-Documents-GitHub-samarth8392-github-io/b7e18e01-7cbd-40cb-96dd-f1ee7959447e/scratchpad/check-topics.js`
Expected: four `PASS` lines, exit code 0.

- [ ] **Step 3: Add the same `TOPIC_KEYWORDS` and `extractTopics` to `pubs.md`**

In `pubs.md`, immediately after the closing brace of `formatAuthors` (the `}` that ends the function, currently followed by a blank line and then `function createPublicationCard(pub) {`), insert:

```js
const TOPIC_KEYWORDS = {
    'Cancer & Oncology': ['cancer', 'tumor', 'tumour', 'oncolog', 'carcinoma', 'organoid', 'car t', 'chimeric antigen', 'immunotherap', 'liquid biopsy', 'ceramide', 'glioma', 'sarcoma', 'leukemia', 'biomarker'],
    'Population Genetics': ['population genetic', 'genetic diversity', 'genetic load', 'gene flow', 'heterozygosity', 'runs of homozygosity', 'inbreeding', 'genetic erosion', 'effective population size'],
    'Conservation Genomics': ['conservation', 'endanger', 'threatened species', 'assisted gene flow', 'wildlife', 'reintroduc'],
    'Evolutionary Biology': ['evolution', 'speciation', 'adaptive', 'selection', 'diversifying selection'],
    'Immunogenetics': ['immune', 'immunogenetic', 'mhc', 'major histocompatibility', 'disease response', 'pathogen'],
    'Genomics & Bioinformatics': ['genome', 'genomic', 'sequenc', 'microsatellite', 'chloroplast', 'assembly', 'comparative genome'],
    'Plant Science': ['juglandaceae', 'walnut', 'butternut', 'plant'],
    'Microbiology': ['pseudomonas', 'bacteri', 'microbial', 'bioremediation', 'metabolic'],
};

function extractTopics(pub) {
    const text = `${pub.title || ''} ${pub.journal || ''}`.toLowerCase();
    const topics = Object.keys(TOPIC_KEYWORDS).filter(topic =>
        TOPIC_KEYWORDS[topic].some(keyword => text.includes(keyword))
    );
    return topics.length > 0 ? topics : ['General Biology'];
}
```

- [ ] **Step 4: Confirm the page still builds**

Run: `bundle exec jekyll build` (from repo root)
Expected: exits 0, no Liquid/HTML errors. Then: `grep -n "extractTopics" _site/pubs/index.html` (or `_site/pubs.html`, whichever `jekyll build` emits — check with `find _site -iname 'pubs*'` if unsure) — expect the function text to appear in the built output.

- [ ] **Step 5: Commit**

```bash
git add pubs.md
git commit -m "feat: add topic-tagging logic for publications"
```

---

### Task 2: Filter state, pill rendering, and card filtering

**Files:**
- Modify: `pubs.md`

**Interfaces:**
- Consumes: `extractTopics(pub)` from Task 1.
- Produces: `pubFilterState` (object `{ year: string, topic: string }`, `'all'` meaning unfiltered), `renderPubFilters()`, `applyPubFilters()`, `getSortedYears()`, `getSortedTopics()`. `createPublicationCard` now emits `data-year` and `data-topics` attributes read by `applyPubFilters()`. `updateUI()` (already exists) is modified to call the topic-tagging, filter-rendering, and filter-applying steps in order.

- [ ] **Step 1: Add filter-row and no-results containers to the page markup**

In `pubs.md`, the current markup is:

```html
    <!-- Publications List -->
    <div id="publications-list"></div>
```

Replace with:

```html
    <!-- Publication Filters -->
    <div class="pub-filter-row" id="pub-year-filters"></div>
    <div class="pub-filter-row" id="pub-topic-filters"></div>
    <div id="pub-no-results" class="pub-no-results" style="display:none;">
        <i class="fas fa-filter"></i> No publications match the selected filters.
    </div>

    <!-- Publications List -->
    <div id="publications-list"></div>
```

- [ ] **Step 2: Add filter state near the other module-level state**

Current:

```js
let publications = [];
let isLoading = false;
```

Replace with:

```js
let publications = [];
let isLoading = false;
let pubFilterState = { year: 'all', topic: 'all' };
```

- [ ] **Step 3: Tag `data-year`/`data-topics` onto each rendered card**

Current `createPublicationCard` opens with:

```js
function createPublicationCard(pub) {
    const scholarSearchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`;
    
    return `
        <div class="publication-card">
```

Replace with:

```js
function createPublicationCard(pub) {
    const scholarSearchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`;
    const topics = pub.topics || [];

    return `
        <div class="publication-card" data-year="${pub.year || ''}" data-topics="${topics.join(',')}">
```

- [ ] **Step 4: Add the filter-rendering and filter-applying functions**

Insert these new functions immediately after `createPublicationCard`'s closing (right before `function updateUI() {`):

```js
function getSortedYears() {
    const years = [...new Set(
        publications.map(p => p.year).filter(y => y && y !== 'n.d.' && y !== 'Year not available')
    )];
    return years.sort((a, b) => b - a);
}

function getSortedTopics() {
    const counts = {};
    publications.forEach(pub => {
        (pub.topics || []).forEach(topic => {
            counts[topic] = (counts[topic] || 0) + 1;
        });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function renderPubFilters() {
    const yearContainer = document.getElementById('pub-year-filters');
    const topicContainer = document.getElementById('pub-topic-filters');
    if (!yearContainer || !topicContainer) return;

    const years = getSortedYears();
    yearContainer.innerHTML = [
        `<button type="button" class="pub-filter-btn${pubFilterState.year === 'all' ? ' active' : ''}" data-year="all">All years</button>`,
        ...years.map(y => `<button type="button" class="pub-filter-btn${pubFilterState.year === String(y) ? ' active' : ''}" data-year="${y}">${y}</button>`)
    ].join('');

    const topics = getSortedTopics();
    topicContainer.innerHTML = [
        `<button type="button" class="pub-filter-btn${pubFilterState.topic === 'all' ? ' active' : ''}" data-topic="all">All topics</button>`,
        ...topics.map(([label, count]) => `<button type="button" class="pub-filter-btn${pubFilterState.topic === label ? ' active' : ''}" data-topic="${label}">${label} <span class="count">${count}</span></button>`)
    ].join('');

    yearContainer.querySelectorAll('.pub-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.year;
            pubFilterState.year = (pubFilterState.year === value) ? 'all' : value;
            renderPubFilters();
            applyPubFilters();
        });
    });

    topicContainer.querySelectorAll('.pub-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = btn.dataset.topic;
            pubFilterState.topic = (pubFilterState.topic === value) ? 'all' : value;
            renderPubFilters();
            applyPubFilters();
        });
    });
}

function applyPubFilters() {
    const cards = document.querySelectorAll('#publications-list .publication-card');
    let visibleCount = 0;
    cards.forEach(card => {
        const matchesYear = pubFilterState.year === 'all' || card.dataset.year === pubFilterState.year;
        const cardTopics = (card.dataset.topics || '').split(',').filter(Boolean);
        const matchesTopic = pubFilterState.topic === 'all' || cardTopics.includes(pubFilterState.topic);
        const visible = matchesYear && matchesTopic;
        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });

    const noResults = document.getElementById('pub-no-results');
    if (noResults) {
        noResults.style.display = (cards.length > 0 && visibleCount === 0) ? 'block' : 'none';
    }
}
```

- [ ] **Step 5: Wire tagging + filter rendering into `updateUI()`**

Current:

```js
function updateUI() {
    const publicationsList = document.getElementById('publications-list');
    const emptyState = document.getElementById('empty-state');

    // Show/hide empty state and publications
    if (publications.length === 0) {
        emptyState.style.display = 'block';
        publicationsList.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        publicationsList.innerHTML = publications
            .map(pub => createPublicationCard(pub))
            .join('');
        
        // Reinitialize Altmetric badges
        if (window._altmetric_embed_init) {
            window._altmetric_embed_init();
        }
    }
}
```

Replace with:

```js
function updateUI() {
    const publicationsList = document.getElementById('publications-list');
    const emptyState = document.getElementById('empty-state');

    publications.forEach(pub => {
        if (!pub.topics) pub.topics = extractTopics(pub);
    });

    // Show/hide empty state and publications
    if (publications.length === 0) {
        emptyState.style.display = 'block';
        publicationsList.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        publicationsList.innerHTML = publications
            .map(pub => createPublicationCard(pub))
            .join('');
        
        // Reinitialize Altmetric badges
        if (window._altmetric_embed_init) {
            window._altmetric_embed_init();
        }
    }

    // Filter pill rows only rebuild once loading has finished, so they
    // don't visibly reshuffle while publications are still streaming in.
    if (!isLoading) {
        renderPubFilters();
    }
    applyPubFilters();
}
```

- [ ] **Step 6: Verify in a browser**

Run: `bundle exec jekyll serve` (from repo root), then open `http://localhost:4000/pubs` (adjust path/baseurl if `_config.yml` sets one — check the `Publications: "pubs"` nav entry and the site's `baseurl`/`url` config if the page 404s at that path).

Confirm, in order:
1. Publications load and render as before (no regression).
2. Once loading finishes, a row of year pills and a row of topic pills (with count numbers) appear above the list.
3. Clicking a year pill hides cards from other years; the clicked pill visually marks itself active (no styling yet — that's Task 3 — but the `active` class should be present in dev tools).
4. Clicking the same year pill again shows all years again.
5. Combine a year + topic pill selection and confirm only cards matching both remain visible.
6. Find any year/topic combination with zero matches (try a narrow topic like "Plant Science" together with a year it didn't publish in) and confirm the "No publications match the selected filters." message appears, and disappears when you clear a filter.

- [ ] **Step 7: Commit**

```bash
git add pubs.md
git commit -m "feat: add clickable year/topic filters to publications list"
```

---

### Task 3: Filter pill styling

**Files:**
- Modify: `assets/css/publications.css`

**Interfaces:**
- Consumes: the `.pub-filter-row`, `.pub-filter-btn`, `[data-year]`, `[data-topic]`, `.active`, `.count`, and `#pub-no-results` / `.pub-no-results` selectors introduced by Task 2's markup and JS.
- Produces: none consumed by later tasks (this is the last task).

- [ ] **Step 1: Add pill and no-results styles**

Append to the end of `assets/css/publications.css` (before the final closing of the file, i.e. after the existing `@media (max-width: 768px) { ... }` block that ends the file):

```css

/* Year/Topic Filter Pills */
.pub-filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.pub-filter-row:last-of-type {
    margin-bottom: 1.5rem;
}

.pub-filter-btn {
    background: #f1f3f5;
    border: 1px solid #dee2e6;
    color: #495057;
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.pub-filter-btn:hover {
    background: #e9ecef;
}

.pub-filter-btn[data-year].active {
    background: #007bff;
    border-color: #007bff;
    color: white;
}

.pub-filter-btn[data-topic].active {
    background: #6f42c1;
    border-color: #6f42c1;
    color: white;
}

.pub-filter-btn .count {
    opacity: 0.7;
    font-weight: 400;
    margin-left: 0.15rem;
}

.pub-no-results {
    text-align: center;
    color: #6c757d;
    padding: 2rem 0;
    font-size: 0.95rem;
}

@media (max-width: 768px) {
    .pub-filter-btn {
        font-size: 0.8rem;
        padding: 0.3rem 0.7rem;
    }
}
```

- [ ] **Step 2: Verify visually**

With `bundle exec jekyll serve` still running (restart it if it was stopped — Jekyll serves CSS as a static asset so a plain browser refresh of `http://localhost:4000/pubs` is enough, no rebuild needed for CSS-only changes), confirm:
1. Pills render as rounded buttons with light-gray background and border.
2. The active year pill is solid blue (`#007bff`) with white text.
3. The active topic pill is solid purple (`#6f42c1`) with white text.
4. Topic pills show a lighter, smaller count number after the label.
5. On a narrow viewport (resize dev tools to ~375px wide), the pill rows wrap onto multiple lines instead of overflowing horizontally.

- [ ] **Step 3: Commit**

```bash
git add assets/css/publications.css
git commit -m "style: add pill styling for publication year/topic filters"
```

---

## Post-plan cleanup

- [ ] Delete the scratch file `check-topics.js` from the scratchpad directory if it still exists there (it's outside the repo, so it won't be committed regardless, but no need to keep it around).
