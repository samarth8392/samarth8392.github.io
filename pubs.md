---
layout: page
title: Publications
subtitle: Research publications and academic contributions
ext-js:
  - "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"
js:
  - "/assets/js/publications.js"
---

<!-- Include custom CSS -->
<link rel="stylesheet" href="{{ '/assets/css/publications.css' | relative_url }}">

<div class="publications-container">
    <div class="text-center mb-4">
        <a href="https://scholar.google.com/citations?user=kL0KaxQAAAAJ&hl=en" target="_blank" class="scholar-badge">🎓 My Google Scholar Profile</a>
    </div>

    <!-- Impact dashboard: data from _data/metrics.json + _data/publications.json -->
    <section class="pub-dashboard" aria-label="Citation and impact dashboard">
        <div class="pub-stats" id="pub-stats"></div>
        <div class="pub-charts">
            <figure class="pub-chart-card">
                <figcaption>
                    <span id="pub-bars-title">Citations per year</span>
                    <span class="pub-toggle" role="group" aria-label="Chart metric">
                        <button type="button" class="active" data-metric="citations">Citations</button>
                        <button type="button" data-metric="papers">Papers</button>
                    </span>
                </figcaption>
                <div class="pub-chart" id="pub-bars"></div>
            </figure>
            <figure class="pub-chart-card">
                <figcaption><span>Research topics</span><span class="pub-chart-hint">click to filter</span></figcaption>
                <div class="pub-donut-wrap">
                    <div class="pub-chart" id="pub-donut"></div>
                    <ul class="pub-donut-legend" id="pub-donut-legend"></ul>
                </div>
            </figure>
        </div>
        <p class="pub-data-note">
            Citation data from <a href="https://openalex.org/authors/A5081121778" target="_blank" rel="noopener">OpenAlex</a>
            and <a href="https://www.crossref.org/" target="_blank" rel="noopener">Crossref</a>{% if site.data.metrics.updated %}, updated {{ site.data.metrics.updated | date: "%B %-d, %Y" }}{% endif %}.
        </p>
    </section>

    <!-- Tabs -->
    <div class="pub-tabs" role="tablist">
        <button type="button" role="tab" class="pub-tab active" id="tab-papers" aria-controls="panel-papers" aria-selected="true">📚 Papers</button>
        <button type="button" role="tab" class="pub-tab" id="tab-network" aria-controls="panel-network" aria-selected="false">🕸️ Collaboration network</button>
    </div>

    <div role="tabpanel" id="panel-papers" aria-labelledby="tab-papers">
        <!-- Publication Filters -->
        <div class="pub-filter-row" id="pub-year-filters"></div>
        <div class="pub-filter-row" id="pub-topic-filters"></div>
        <div class="pub-active-coauthor" id="pub-active-coauthor" hidden></div>
        <div id="pub-no-results" class="pub-no-results" style="display:none;">
            <i class="fas fa-filter"></i> No publications match the selected filters.
        </div>
        <div id="publications-list"></div>
    </div>

    <div role="tabpanel" id="panel-network" aria-labelledby="tab-network" hidden>
        <p class="pub-network-intro">
            Everyone I have published with. Node size shows how many papers we share, and colour shows where I was at the time.
            Hover to see shared papers, drag to rearrange, pinch or use +/− to zoom, and click a person to list our papers together.
        </p>
        <div class="pub-network-legend" id="pub-network-legend"></div>
        <div class="pub-network" id="pub-network"></div>
    </div>
</div>

<!-- Altmetric Script -->
<script type='text/javascript' src='https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js'></script>

<script>
// Prebuilt by scripts/update_publications.py. To add a paper, add its DOI to
// _data/pub_list.yml; until the Action runs, publications.js fetches any DOI
// missing here live from Crossref.
window.PUB_DATA = {
    list: {{ site.data.pub_list | jsonify }},
    publications: {{ site.data.publications | jsonify }},
    metrics: {{ site.data.metrics | jsonify }}
};
</script>
