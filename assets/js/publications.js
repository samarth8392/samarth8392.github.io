// Publications page: impact dashboard, expandable publication cards with
// citation export, year/topic/co-author filters and a co-author network.
//
// Data is prebuilt into window.PUB_DATA by pubs.md from _data/*.json
// (see scripts/update_publications.py). DOIs listed in _data/pub_list.yml but
// not yet prebuilt are fetched live from Crossref so new papers show up
// immediately.

(function () {
    const OWNER_ID = 'A5081121778';
    const data = window.PUB_DATA || { list: [], publications: [], metrics: {} };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ERAS = {
        IITR: 'IIT Roorkee',
        Purdue: 'Purdue',
        OSU: 'Ohio State',
        NCI: 'NCI / NIH',
    };

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
    const TOPIC_COLORS = {
        'Cancer & Oncology': '#EA615C',
        'Population Genetics': '#3b6fd4',
        'Conservation Genomics': '#2a9d8f',
        'Evolutionary Biology': '#c9940a',
        'Immunogenetics': '#8e5bd0',
        'Genomics & Bioinformatics': '#e07b39',
        'Plant Science': '#5f9e3f',
        'Microbiology': '#b5487a',
        'General Biology': '#8a8a8a',
    };

    let publications = [];
    const state = { year: 'all', topic: 'all', coauthor: null, metric: 'citations' };
    let networkDirty = true;

    // ---------------------------------------------------------------- utils

    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isOwner = (a) => a.id === OWNER_ID || (/\bmathur\b/i.test(a.name) && /^s/i.test(a.name.trim()));
    const personKey = (a) => a.id || `name:${a.name.toLowerCase()}`;
    const currentYear = new Date().getFullYear();

    function splitName(name) {
        const parts = name.trim().split(/\s+/);
        const family = parts.pop() || '';
        return { family, given: parts.join(' ') };
    }

    function initials(given) {
        return given.split(/\s+/).filter(Boolean)
            .map((g) => g.split('-').map((h) => `${h[0].toUpperCase()}.`).join('-'))
            .join(' ');
    }

    const asciiFold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

    let tooltip;
    function showTooltip(html, event) {
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'pub-tooltip';
            document.body.appendChild(tooltip);
        }
        tooltip.innerHTML = html;
        tooltip.classList.add('visible');
        const pad = 14;
        const { offsetWidth: w, offsetHeight: h } = tooltip;
        let x = event.clientX + pad;
        let y = event.clientY + pad;
        if (x + w > window.innerWidth - 8) x = event.clientX - w - pad;
        if (y + h > window.innerHeight - 8) y = event.clientY - h - pad;
        tooltip.style.left = `${Math.max(8, x)}px`;
        tooltip.style.top = `${Math.max(8, y)}px`;
    }
    const hideTooltip = () => tooltip && tooltip.classList.remove('visible');

    // ----------------------------------------------------------------- data

    function extractTopics(pub) {
        const text = `${pub.title || ''} ${pub.journal || ''}`.toLowerCase();
        const topics = Object.keys(TOPIC_KEYWORDS).filter((topic) =>
            TOPIC_KEYWORDS[topic].some((keyword) => text.includes(keyword))
        );
        return topics.length > 0 ? topics : ['General Biology'];
    }

    function eraForYear(year) {
        if (year <= 2015) return 'IITR';
        if (year <= 2021) return 'Purdue';
        if (year <= 2023) return 'OSU';
        return 'NCI';
    }

    function preparePublication(pub) {
        pub.topics = extractTopics(pub);
        pub.people = (pub.authors || []).filter((a) => !isOwner(a)).map(personKey);
        return pub;
    }

    async function fetchFromCrossref(entry) {
        const doi = String(entry.doi).trim();
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
        if (!response.ok) throw new Error(`Crossref ${response.status}`);
        const work = (await response.json()).message;
        const parts = (work.published || work.issued || {})['date-parts']?.[0] || [];
        const year = parts[0] || null;
        const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const isPreprint = work.type === 'posted-content' || /^10\.(1101|21203|22541|64898)\//.test(doi);
        return {
            doi,
            title: strip(work.title?.[0]) || doi,
            authors: (work.author || []).map((a) => ({ id: '', name: `${a.given || ''} ${a.family || ''}`.trim() || a.name || '', institutions: [] })),
            journal: strip(work['container-title']?.[0]) || work.publisher || '',
            year,
            month: parts[1] || null,
            volume: work.volume || '',
            issue: work.issue || '',
            pages: work.page || work['article-number'] || '',
            publisher: work.publisher || '',
            kind: entry.kind || (isPreprint ? 'preprint' : 'article'),
            citations: work['is-referenced-by-count'] || 0,
            abstract: strip(work.abstract).replace(/^(abstract|summary)\s*/i, ''),
            era: eraForYear(year || currentYear),
            highlights: entry.highlights || [],
        };
    }

    function sortPublications() {
        publications.sort((a, b) => ((b.year || 0) - (a.year || 0)) || ((b.month || 0) - (a.month || 0)));
    }

    // ----------------------------------------------------------- dashboard

    function renderStats() {
        const m = data.metrics || {};
        const coauthors = new Set(publications.flatMap((p) => p.people)).size;
        const tiles = [
            ['Publications', publications.length, ''],
            ['Citations', m.citations, '+'],
            ['h-index', m.h_index, ''],
            ['i10-index', m.i10_index, ''],
            ['Co-authors', coauthors, ''],
        ].filter(([, value]) => value !== undefined && value !== null);

        const container = document.getElementById('pub-stats');
        container.innerHTML = tiles.map(([label, value, suffix]) => `
            <div class="pub-stat">
                <div class="pub-stat-value" data-count-to="${value}" data-count-suffix="${suffix}">${Number(value).toLocaleString()}${suffix}</div>
                <div class="pub-stat-label">${label}</div>
            </div>`).join('');
        if (window.initCountUps) window.initCountUps(container);
    }

    function barData() {
        if (state.metric === 'citations') {
            return (data.metrics?.citations_by_year || []).map((d) => ({ year: d.year, value: d.citations }));
        }
        const counts = d3.rollup(publications.filter((p) => p.year), (v) => v.length, (p) => p.year);
        const years = [...counts.keys()];
        if (!years.length) return [];
        return d3.range(d3.min(years), currentYear + 1).map((year) => ({ year, value: counts.get(year) || 0 }));
    }

    function renderBars() {
        const host = document.getElementById('pub-bars');
        if (!host || !window.d3) return;
        const rows = barData();
        const width = host.clientWidth || 420;
        const height = 240;
        const margin = { top: 18, right: 4, bottom: 22, left: 4 };
        host.innerHTML = '';
        document.getElementById('pub-bars-title').textContent =
            state.metric === 'citations' ? 'Citations per year' : 'Papers per year';

        const svg = d3.select(host).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('width', width).attr('height', height)
            .attr('role', 'img')
            .attr('aria-label', `${state.metric === 'citations' ? 'Citations' : 'Papers'} per year: ` + rows.map((r) => `${r.year} ${r.value}`).join(', '));

        const x = d3.scaleBand().domain(rows.map((r) => r.year)).range([margin.left, width - margin.right]).padding(0.22);
        const y = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.value) || 1]).nice().range([height - margin.bottom, margin.top]);
        const labelEvery = x.bandwidth() < 22 ? 2 : 1;

        svg.append('g').attr('class', 'pub-axis')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSize(0).tickPadding(6)
                .tickFormat((d, i) => (i % labelEvery === 0 || i === rows.length - 1) ? `'${String(d).slice(2)}` : ''))
            .call((g) => g.select('.domain').remove());

        const bar = svg.append('g').selectAll('g').data(rows).join('g')
            .attr('class', (d) => `pub-bar${d.year === currentYear ? ' partial' : ''}${state.year === String(d.year) ? ' active' : ''}`)
            .attr('tabindex', 0)
            .on('mousemove', (event, d) => showTooltip(
                `<strong>${d.year}${d.year === currentYear ? ' (so far)' : ''}</strong><br>${d.value} ${state.metric === 'citations' ? 'citations' : (d.value === 1 ? 'paper' : 'papers')}<br><span>click to show papers from ${d.year}</span>`, event))
            .on('mouseleave', hideTooltip)
            .on('click keydown', (event, d) => {
                if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                hideTooltip();
                setFilter('year', String(d.year), true);
            });

        // Invisible full-height hit area makes short bars easy to hover
        bar.append('rect').attr('class', 'pub-bar-hit')
            .attr('x', (d) => x(d.year)).attr('width', x.bandwidth())
            .attr('y', margin.top).attr('height', height - margin.top - margin.bottom);

        const rect = bar.append('rect').attr('class', 'pub-bar-fill')
            .attr('x', (d) => x(d.year)).attr('width', x.bandwidth())
            .attr('rx', Math.min(4, x.bandwidth() / 4))
            .attr('y', y(0)).attr('height', 0);

        bar.append('text').attr('class', 'pub-bar-label')
            .attr('x', (d) => x(d.year) + x.bandwidth() / 2)
            .attr('y', (d) => y(d.value) - 4)
            .text((d) => (d.value && x.bandwidth() >= 16 ? d.value : ''));

        (reduceMotion ? rect : rect.transition().duration(700).delay((d, i) => i * 35).ease(d3.easeCubicOut))
            .attr('y', (d) => y(d.value)).attr('height', (d) => y(0) - y(d.value));
    }

    function topicCounts() {
        const counts = {};
        publications.forEach((pub) => pub.topics.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }

    function renderDonut() {
        const host = document.getElementById('pub-donut');
        const legend = document.getElementById('pub-donut-legend');
        if (!host || !window.d3) return;
        const entries = topicCounts();
        const size = 170;
        const radius = size / 2;
        host.innerHTML = '';

        const svg = d3.select(host).append('svg')
            .attr('viewBox', `0 0 ${size} ${size}`).attr('width', size).attr('height', size)
            .attr('role', 'img')
            .attr('aria-label', 'Papers per research topic: ' + entries.map(([t, c]) => `${t} ${c}`).join(', '));
        const g = svg.append('g').attr('transform', `translate(${radius},${radius})`);
        const pie = d3.pie().sort(null).value((d) => d[1]).padAngle(0.02);
        const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius - 4).cornerRadius(3);
        const arcHover = d3.arc().innerRadius(radius * 0.6).outerRadius(radius).cornerRadius(3);

        const center = g.append('text').attr('class', 'pub-donut-center').attr('text-anchor', 'middle');
        const centerValue = center.append('tspan').attr('x', 0).attr('dy', '-0.1em').attr('class', 'value');
        const centerLabel = center.append('tspan').attr('x', 0).attr('dy', '1.4em').attr('class', 'label');
        const setCenter = (value, label) => { centerValue.text(value); centerLabel.text(label); };
        const resetCenter = () => {
            const active = entries.find(([t]) => t === state.topic);
            if (active) setCenter(active[1], 'papers');
            else setCenter(publications.length, 'papers');
        };
        resetCenter();

        g.selectAll('path').data(pie(entries)).join('path')
            .attr('class', (d) => `pub-donut-slice${state.topic === d.data[0] ? ' active' : ''}${state.topic !== 'all' && state.topic !== d.data[0] ? ' dim' : ''}`)
            .attr('fill', (d) => TOPIC_COLORS[d.data[0]] || '#999')
            .attr('d', arc)
            .attr('tabindex', 0)
            .on('mouseenter', function (event, d) {
                d3.select(this).attr('d', arcHover);
                setCenter(d.data[1], d.data[0].length > 16 ? d.data[0].split(' ')[0] : d.data[0]);
            })
            .on('mousemove', (event, d) => showTooltip(`<strong>${esc(d.data[0])}</strong><br>${d.data[1]} papers<br><span>click to filter</span>`, event))
            .on('mouseleave', function () { d3.select(this).attr('d', arc); hideTooltip(); resetCenter(); })
            .on('click keydown', (event, d) => {
                if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                hideTooltip();
                setFilter('topic', d.data[0], true);
            });

        legend.innerHTML = entries.map(([topic, count]) => `
            <li><button type="button" class="${state.topic === topic ? 'active' : ''}${state.topic !== 'all' && state.topic !== topic ? ' dim' : ''}" data-topic="${esc(topic)}">
                <i style="background:${TOPIC_COLORS[topic] || '#999'}"></i>${esc(topic)} <span>${count}</span>
            </button></li>`).join('');
    }

    // --------------------------------------------------------------- cards

    function formatAuthors(authors, full) {
        if (!authors.length) return 'Authors not available';
        const names = authors.map((a) => (isOwner(a) ? `<strong>${esc(a.name)}</strong>` : esc(a.name)));
        if (full || names.length <= 6) {
            if (names.length === 1) return names[0];
            return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
        }
        // Short form: first three, then me if I'm further down, then the last author
        const ownerIndex = authors.findIndex(isOwner);
        const shown = [names[0], names[1], names[2]];
        if (ownerIndex >= 3 && ownerIndex < names.length - 1) shown.push('…', names[ownerIndex]);
        shown.push('…', names[names.length - 1]);
        return `${shown.join(', ').replace(/, …/g, ' …')} <button type="button" class="pub-link-btn" data-action="authors">all ${names.length} authors</button>`;
    }

    function apaCitation(pub) {
        const authors = pub.authors.map((a) => {
            const { family, given } = splitName(a.name);
            return given ? `${family}, ${initials(given)}` : family;
        });
        let list;
        if (authors.length <= 1) list = authors[0] || '';
        else if (authors.length <= 20) list = `${authors.slice(0, -1).join(', ')}, & ${authors[authors.length - 1]}`;
        else list = `${authors.slice(0, 19).join(', ')}, . . . ${authors[authors.length - 1]}`;
        const volume = pub.volume ? `, ${pub.volume}` : '';
        const issue = pub.volume && pub.issue ? `(${pub.issue})` : '';
        const pages = pub.pages ? `, ${pub.pages.replace('-', '–')}` : '';
        const kind = pub.kind === 'preprint' ? ' [Preprint]' : '';
        return `${list} (${pub.year || 'n.d.'}). ${pub.title}${kind}. ${pub.journal}${volume}${issue}${pages}. https://doi.org/${pub.doi}`;
    }

    function bibtexCitation(pub) {
        const first = pub.authors[0] ? asciiFold(splitName(pub.authors[0].name).family).toLowerCase().replace(/[^a-z]/g, '') : 'anon';
        const stop = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'are']);
        const word = (asciiFold(pub.title).toLowerCase().match(/[a-z]{3,}/g) || []).find((w) => !stop.has(w)) || 'paper';
        const type = pub.kind === 'preprint' ? 'misc' : 'article';
        const fields = [
            ['title', `{${pub.title}}`],
            ['author', pub.authors.map((a) => {
                const { family, given } = splitName(a.name);
                return given ? `${family}, ${given}` : family;
            }).join(' and ')],
            [type === 'misc' ? 'howpublished' : 'journal', pub.journal],
            ['year', pub.year],
            ['volume', pub.volume],
            ['number', pub.issue],
            ['pages', pub.pages && pub.pages.replace('-', '--')],
            ['publisher', pub.publisher],
            ['doi', pub.doi],
            ['url', `https://doi.org/${pub.doi}`],
            ['note', pub.kind === 'preprint' ? 'Preprint' : ''],
        ].filter(([, v]) => v);
        return `@${type}{${first}${pub.year || ''}${word},\n${fields.map(([k, v]) => `  ${k} = {${v}}`).join(',\n')}\n}`;
    }

    function createPublicationCard(pub, index) {
        const scholarSearchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`;
        const kindChip = pub.kind === 'preprint' ? '<span class="pub-chip pub-chip-preprint">Preprint</span>'
            : pub.kind === 'abstract' ? '<span class="pub-chip pub-chip-abstract">Conference abstract</span>' : '';
        const highlights = (pub.highlights || []).map((h) => `<span class="pub-chip pub-chip-highlight"><i class="fas fa-award"></i> ${esc(h)}</span>`).join('');
        const topicDots = pub.topics.map((t) => `<span class="pub-topic" style="--topic:${TOPIC_COLORS[t] || '#999'}">${esc(t)}</span>`).join('');

        return `
        <article class="publication-card${pub.highlights?.length ? ' is-highlight' : ''}" data-index="${index}" data-year="${pub.year || ''}" data-topics="${esc(pub.topics.join(','))}" data-people="${esc(pub.people.join('|'))}">
            ${kindChip || highlights ? `<div class="pub-chips">${highlights}${kindChip}</div>` : ''}
            <h3 class="publication-title">${esc(pub.title)}</h3>
            <div class="publication-authors">${formatAuthors(pub.authors, false)}</div>
            <div class="publication-details">
                <span class="journal-name">${esc(pub.journal)}</span> (${pub.year || 'n.d.'})${pub.volume ? `, ${esc(pub.volume)}` : ''}${pub.issue ? `(${esc(pub.issue)})` : ''}${pub.pages ? `, ${esc(pub.pages)}` : ''}
            </div>
            <div class="pub-topics">${topicDots}</div>

            <div class="pub-actions">
                ${pub.abstract ? '<button type="button" class="pub-action" data-action="abstract" aria-expanded="false"><i class="fas fa-align-left"></i> Abstract</button>' : ''}
                <button type="button" class="pub-action" data-action="cite" aria-expanded="false"><i class="fas fa-quote-right"></i> Cite</button>
                <a class="pub-action" href="https://doi.org/${esc(pub.doi)}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> DOI</a>
            </div>
            <div class="pub-panel pub-abstract" hidden></div>
            <div class="pub-panel pub-cite" hidden></div>

            <div class="publication-footer">
                <a href="https://doi.org/${esc(pub.doi)}" target="_blank" class="doi-link">🔗 https://doi.org/${esc(pub.doi)}</a>
                <div class="metrics-section">
                    <span class="citation-badge">${pub.citations || 0} citations</span>
                    <a href="${scholarSearchUrl}" target="_blank" class="scholar-badge">🎓 Google Scholar</a>
                    <div class="altmetric-embed" data-badge-type="donut" data-doi="${esc(pub.doi)}" data-badge-popover="right" data-badge-details="right"></div>
                </div>
            </div>
        </article>`;
    }

    function renderList() {
        const list = document.getElementById('publications-list');
        list.innerHTML = publications.map(createPublicationCard).join('');
        if (window._altmetric_embed_init) window._altmetric_embed_init();
    }

    function copyText(text, button) {
        const done = () => {
            const label = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied';
            button.classList.add('copied');
            setTimeout(() => { button.innerHTML = label; button.classList.remove('copied'); }, 1600);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text) && done());
        } else if (fallbackCopy(text)) {
            done();
        }
    }

    function fallbackCopy(text) {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        area.remove();
        return ok;
    }

    function renderCitePanel(panel, pub, format) {
        const text = format === 'bibtex' ? bibtexCitation(pub) : apaCitation(pub);
        panel.innerHTML = `
            <div class="pub-cite-head">
                <div class="pub-toggle" role="group" aria-label="Citation format">
                    <button type="button" data-format="apa" class="${format === 'apa' ? 'active' : ''}">APA</button>
                    <button type="button" data-format="bibtex" class="${format === 'bibtex' ? 'active' : ''}">BibTeX</button>
                </div>
                <button type="button" class="pub-action pub-copy"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <pre class="pub-cite-text${format === 'bibtex' ? ' is-code' : ''}">${esc(text)}</pre>`;
        panel.dataset.format = format;
    }

    function togglePanel(card, panel, button) {
        const opening = panel.hidden;
        card.querySelectorAll('.pub-panel').forEach((p) => { p.hidden = true; });
        card.querySelectorAll('.pub-action[aria-expanded]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        if (opening) {
            panel.hidden = false;
            button.setAttribute('aria-expanded', 'true');
        }
        return opening;
    }

    function onListClick(event) {
        const target = event.target.closest('button');
        if (!target) return;
        const card = target.closest('.publication-card');
        const pub = publications[Number(card.dataset.index)];

        if (target.dataset.action === 'authors') {
            card.querySelector('.publication-authors').innerHTML = formatAuthors(pub.authors, true);
        } else if (target.dataset.action === 'abstract') {
            const panel = card.querySelector('.pub-abstract');
            if (!panel.textContent) panel.innerHTML = `<p>${esc(pub.abstract)}</p>`;
            togglePanel(card, panel, target);
        } else if (target.dataset.action === 'cite') {
            const panel = card.querySelector('.pub-cite');
            if (togglePanel(card, panel, target) && !panel.dataset.format) renderCitePanel(panel, pub, 'apa');
        } else if (target.dataset.format) {
            renderCitePanel(card.querySelector('.pub-cite'), pub, target.dataset.format);
        } else if (target.classList.contains('pub-copy')) {
            copyText(card.querySelector('.pub-cite-text').textContent, target);
        }
    }

    // ------------------------------------------------------------- filters

    function renderFilters() {
        const yearContainer = document.getElementById('pub-year-filters');
        const topicContainer = document.getElementById('pub-topic-filters');
        const years = [...new Set(publications.map((p) => p.year).filter(Boolean))].sort((a, b) => b - a);

        yearContainer.innerHTML = [
            `<button type="button" class="pub-filter-btn${state.year === 'all' ? ' active' : ''}" data-year="all">All years</button>`,
            ...years.map((y) => `<button type="button" class="pub-filter-btn${state.year === String(y) ? ' active' : ''}" data-year="${y}">${y}</button>`),
        ].join('');

        topicContainer.innerHTML = [
            `<button type="button" class="pub-filter-btn${state.topic === 'all' ? ' active' : ''}" data-topic="all">All topics</button>`,
            ...topicCounts().map(([label, count]) => `<button type="button" class="pub-filter-btn${state.topic === label ? ' active' : ''}" data-topic="${esc(label)}">${esc(label)} <span class="count">${count}</span></button>`),
        ].join('');

        const chip = document.getElementById('pub-active-coauthor');
        if (state.coauthor) {
            chip.hidden = false;
            chip.innerHTML = `<span>Papers with <strong>${esc(state.coauthor.name)}</strong></span>
                <button type="button" class="pub-filter-btn active" data-clear-coauthor>✕ Clear</button>`;
        } else {
            chip.hidden = true;
            chip.innerHTML = '';
        }
    }

    function applyFilters() {
        const cards = document.querySelectorAll('#publications-list .publication-card');
        let visible = 0;
        cards.forEach((card) => {
            const matchesYear = state.year === 'all' || card.dataset.year === state.year;
            const matchesTopic = state.topic === 'all' || card.dataset.topics.split(',').includes(state.topic);
            const matchesPerson = !state.coauthor || card.dataset.people.split('|').includes(state.coauthor.key);
            const show = matchesYear && matchesTopic && matchesPerson;
            card.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        document.getElementById('pub-no-results').style.display = cards.length && !visible ? 'block' : 'none';
    }

    function setFilter(kind, value, fromChart) {
        if (kind === 'coauthor') {
            state.coauthor = value;
        } else {
            state[kind] = state[kind] === value ? 'all' : value;
        }
        renderFilters();
        applyFilters();
        renderDonut();
        renderBars();
        if (fromChart || kind === 'coauthor') {
            showTab('papers');
            const target = document.querySelector('.pub-tabs');
            const top = target.getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }

    function onFilterClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-clear-coauthor')) return setFilter('coauthor', null);
        if (button.dataset.year) return setFilter('year', button.dataset.year);
        if (button.dataset.topic) return setFilter('topic', button.dataset.topic);
    }

    // ---------------------------------------------------------------- tabs

    function showTab(name) {
        ['papers', 'network'].forEach((tab) => {
            const active = tab === name;
            document.getElementById(`tab-${tab}`).classList.toggle('active', active);
            document.getElementById(`tab-${tab}`).setAttribute('aria-selected', String(active));
            document.getElementById(`panel-${tab}`).hidden = !active;
        });
        if (name === 'network' && networkDirty) renderNetwork();
        const hash = name === 'network' ? '#network' : '';
        if (window.location.hash !== hash) history.replaceState(null, '', `${window.location.pathname}${hash}`);
    }

    // ------------------------------------------------------------- network

    function buildNetwork() {
        const people = new Map();
        const pairCounts = new Map();
        publications.forEach((pub, index) => {
            const coauthors = [];
            const seen = new Set();
            (pub.authors || []).forEach((a) => {
                if (isOwner(a)) return;
                const key = personKey(a);
                if (seen.has(key)) return;
                seen.add(key);
                coauthors.push(key);
                if (!people.has(key)) people.set(key, { id: key, name: a.name, papers: [], eras: {}, institution: '' });
                const person = people.get(key);
                person.papers.push(index);
                person.eras[pub.era] = (person.eras[pub.era] || 0) + 1;
                if (!person.institution && a.institutions?.length) person.institution = a.institutions[0];
            });
            for (let i = 0; i < coauthors.length; i++) {
                for (let j = i + 1; j < coauthors.length; j++) {
                    const pair = coauthors[i] < coauthors[j] ? `${coauthors[i]}\u0000${coauthors[j]}` : `${coauthors[j]}\u0000${coauthors[i]}`;
                    pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
                }
            }
        });

        const nodes = [...people.values()].map((p) => ({
            ...p,
            shared: p.papers.length,
            era: Object.entries(p.eras).sort((a, b) => b[1] - a[1])[0][0],
        }));
        const owner = { id: 'owner', name: 'Samarth Mathur', owner: true, shared: publications.length };
        const links = nodes.map((n) => ({ source: 'owner', target: n.id, weight: n.shared, spoke: true }));
        // Only repeat collaborations between co-authors, otherwise large
        // consortium papers turn the graph into a hairball.
        pairCounts.forEach((count, pair) => {
            if (count < 2) return;
            const [a, b] = pair.split('\u0000');
            links.push({ source: a, target: b, weight: count, spoke: false });
        });
        return { nodes: [owner, ...nodes], links };
    }

    function renderNetwork() {
        const host = document.getElementById('pub-network');
        if (!host || !window.d3 || host.offsetParent === null) return;
        networkDirty = false;
        host.innerHTML = '';

        const { nodes, links } = buildNetwork();
        const width = host.clientWidth;
        const height = Math.round(Math.min(600, Math.max(420, width * 0.68)));
        const radius = (n) => (n.owner ? 18 : 3.5 + 3 * Math.sqrt(n.shared));
        const eraOrder = ['NCI', 'OSU', 'Purdue', 'IITR'];
        const eraCounts = d3.rollup(nodes.filter((n) => !n.owner), (v) => v.length, (n) => n.era);
        const ring = Math.min(width, height) * 0.3;
        const anchor = {};
        eraOrder.forEach((era, i) => {
            const angle = -Math.PI / 4 + (i * Math.PI) / 2;
            anchor[era] = { x: width / 2 + Math.cos(angle) * ring * 1.25, y: height / 2 + Math.sin(angle) * ring };
        });

        // Legend doubles as a highlight control
        const legend = document.getElementById('pub-network-legend');
        legend.innerHTML = eraOrder.filter((e) => eraCounts.get(e)).map((era) =>
            `<button type="button" data-era="${era}"><i class="era-swatch era-${era}"></i>${ERAS[era]} <span>${eraCounts.get(era)}</span></button>`
        ).join('') + `<span class="pub-network-zoom">
            <button type="button" data-zoom="in" aria-label="Zoom in">+</button>
            <button type="button" data-zoom="out" aria-label="Zoom out">−</button>
            <button type="button" data-zoom="reset" aria-label="Reset view"><i class="fas fa-compress"></i></button>
        </span>`;

        const svg = d3.select(host).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height)
            .attr('role', 'img')
            .attr('aria-label', `Co-author network: ${nodes.length - 1} collaborators across ${publications.length} publications.`);
        const viewport = svg.append('g');

        const zoom = d3.zoom().scaleExtent([0.5, 4])
            // Wheel zoom only with ctrl/⌘ (trackpad pinch sets ctrlKey) so the page still scrolls normally
            .filter((event) => (event.type === 'wheel' ? event.ctrlKey || event.metaKey : !event.button))
            .on('zoom', (event) => viewport.attr('transform', event.transform));
        svg.call(zoom).on('dblclick.zoom', null);

        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d) => d.id)
                .distance((l) => (l.spoke ? ring * 0.9 / Math.sqrt(l.weight) : 24))
                .strength((l) => (l.spoke ? 0.03 : 0.25)))
            .force('charge', d3.forceManyBody().strength((d) => (d.owner ? -300 : -28)))
            .force('collide', d3.forceCollide().radius((d) => radius(d) + 2))
            .force('x', d3.forceX((d) => (d.owner ? width / 2 : anchor[d.era].x)).strength((d) => (d.owner ? 1 : 0.07)))
            .force('y', d3.forceY((d) => (d.owner ? height / 2 : anchor[d.era].y)).strength((d) => (d.owner ? 1 : 0.07)));
        const ownerNode = nodes[0];
        ownerNode.fx = width / 2;
        ownerNode.fy = height / 2;

        const link = viewport.append('g').attr('class', 'net-links').selectAll('line').data(links).join('line')
            .attr('class', (l) => (l.spoke ? `net-spoke era-${l.target.era || ''}` : 'net-link'))
            .attr('stroke-width', (l) => (l.spoke ? 0.6 + Math.log2(l.weight) : 0.8));

        const node = viewport.append('g').selectAll('g').data(nodes).join('g')
            .attr('class', (d) => (d.owner ? 'net-node net-owner' : `net-node era-${d.era}`))
            .attr('tabindex', (d) => (d.owner ? null : 0))
            .attr('role', (d) => (d.owner ? null : 'button'))
            .attr('aria-label', (d) => (d.owner ? null : `${d.name}, ${d.shared} shared ${d.shared === 1 ? 'paper' : 'papers'}`));
        node.append('circle').attr('r', radius);
        // Name only the closest collaborators; everyone else is in the tooltip
        node.filter((d) => d.owner || d.shared >= 3).append('text')
            .attr('class', (d) => (d.owner ? 'net-owner-label' : 'net-label'))
            .attr('dy', (d) => (d.owner ? '0.35em' : -radius(d) - 3))
            .text((d) => (d.owner ? 'SM' : splitName(d.name).family));

        const neighbours = new Map(nodes.map((n) => [n.id, new Set([n.id])]));
        links.forEach((l) => {
            neighbours.get(l.source.id || l.source).add(l.target.id || l.target);
            neighbours.get(l.target.id || l.target).add(l.source.id || l.source);
        });

        function focus(d) {
            const near = neighbours.get(d.id);
            node.classed('dim', (n) => !n.owner && !near.has(n.id));
            link.classed('dim', (l) => l.source.id !== d.id && l.target.id !== d.id);
            link.classed('lit', (l) => l.source.id === d.id || l.target.id === d.id);
        }
        function unfocus() {
            node.classed('dim', false);
            link.classed('dim', false).classed('lit', false);
        }

        function tooltipFor(d) {
            if (d.owner) return `<strong>Samarth Mathur</strong><br>${nodes.length - 1} co-authors · ${publications.length} papers`;
            const titles = d.papers.slice(0, 3).map((i) => `<li>${esc(publications[i].title)} <span>(${publications[i].year})</span></li>`).join('');
            const more = d.papers.length > 3 ? `<li><span>+${d.papers.length - 3} more</span></li>` : '';
            return `<strong>${esc(d.name)}</strong>${d.institution ? `<br><span>${esc(d.institution)}</span>` : ''}
                <br>${d.shared} shared ${d.shared === 1 ? 'paper' : 'papers'} · mostly ${ERAS[d.era]}
                <ul>${titles}${more}</ul><span>click to list our papers</span>`;
        }

        node.on('mouseenter focus', (event, d) => focus(d))
            .on('mousemove', (event, d) => showTooltip(tooltipFor(d), event))
            .on('mouseleave blur', () => { unfocus(); hideTooltip(); })
            .on('click keydown', (event, d) => {
                if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
                if (d.owner || event.defaultPrevented) return;
                event.preventDefault();
                hideTooltip();
                setFilter('coauthor', { key: d.id, name: d.name });
            });

        node.call(d3.drag()
            .on('start', (event, d) => {
                if (d.owner) return;
                if (!event.active) simulation.alphaTarget(0.25).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on('drag', (event, d) => { if (!d.owner) { d.fx = event.x; d.fy = event.y; } })
            .on('end', (event, d) => {
                if (d.owner) return;
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
            }));

        function draw() {
            link.attr('x1', (l) => l.source.x).attr('y1', (l) => l.source.y)
                .attr('x2', (l) => l.target.x).attr('y2', (l) => l.target.y);
            node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        }
        // Zoom so every node fits the frame
        function fit(duration) {
            const pad = 30;
            const [x0, x1] = d3.extent(nodes, (d) => d.x);
            const [y0, y1] = d3.extent(nodes, (d) => d.y);
            const k = Math.min(1.6, (width - 2 * pad) / (x1 - x0 || 1), (height - 2 * pad) / (y1 - y0 || 1));
            const transform = d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(k)
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
            (duration ? svg.transition().duration(duration) : svg).call(zoom.transform, transform);
        }

        // Settle most of the layout up front so the graph doesn't fly in from a heap
        simulation.stop();
        for (let i = 0; i < (reduceMotion ? 300 : 160); i++) simulation.tick();
        draw();
        fit(0);
        if (!reduceMotion) {
            simulation.on('tick', draw).on('end', () => fit(500)).alpha(0.08).restart();
        }

        let eraFocus = null;
        legend.onclick = (event) => {
            const button = event.target.closest('button');
            if (!button) return;
            if (button.dataset.zoom) {
                const z = button.dataset.zoom;
                const t = svg.transition().duration(reduceMotion ? 0 : 300);
                if (z === 'reset') fit(reduceMotion ? 0 : 300);
                else t.call(zoom.scaleBy, z === 'in' ? 1.4 : 1 / 1.4);
                return;
            }
            eraFocus = eraFocus === button.dataset.era ? null : button.dataset.era;
            legend.querySelectorAll('button[data-era]').forEach((b) => b.classList.toggle('active', b.dataset.era === eraFocus));
            node.classed('dim', (n) => !!eraFocus && !n.owner && n.era !== eraFocus);
            link.classed('dim', (l) => !!eraFocus && (l.target.era !== eraFocus));
        };
    }

    // ---------------------------------------------------------------- init

    function renderAll() {
        sortPublications();
        renderStats();
        renderBars();
        renderDonut();
        renderFilters();
        renderList();
        applyFilters();
        networkDirty = true;
        if (!document.getElementById('panel-network').hidden) renderNetwork();
    }

    async function loadMissing(entries) {
        const results = await Promise.allSettled(entries.map(fetchFromCrossref));
        const added = results.filter((r) => r.status === 'fulfilled').map((r) => preparePublication(r.value));
        results.filter((r) => r.status === 'rejected').forEach((r) => console.warn('Crossref fetch failed:', r.reason));
        if (added.length) {
            publications.push(...added);
            renderAll();
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const prebuilt = new Map((data.publications || []).map((p) => [p.doi.toLowerCase(), p]));
        // Highlights and kind are edited in pub_list.yml, so they win over the prebuilt copy
        (data.list || []).forEach((entry) => {
            const pub = prebuilt.get(String(entry.doi).toLowerCase());
            if (!pub) return;
            if (entry.highlights) pub.highlights = entry.highlights;
            if (entry.kind) pub.kind = entry.kind;
        });
        const listed = new Set((data.list || []).map((e) => String(e.doi).toLowerCase()));
        publications = [...prebuilt.values()]
            .filter((p) => !data.list?.length || listed.has(p.doi.toLowerCase()))
            .map(preparePublication);

        if (!window.d3) {
            document.querySelector('.pub-charts').hidden = true;
        }

        renderAll();
        loadMissing((data.list || []).filter((e) => !prebuilt.has(String(e.doi).toLowerCase())));

        document.getElementById('publications-list').addEventListener('click', onListClick);
        document.getElementById('panel-papers').addEventListener('click', (event) => {
            if (!event.target.closest('#publications-list')) onFilterClick(event);
        });
        document.getElementById('pub-donut-legend').addEventListener('click', (event) => {
            const button = event.target.closest('button[data-topic]');
            if (button) setFilter('topic', button.dataset.topic, true);
        });
        document.querySelectorAll('.pub-dashboard .pub-toggle button').forEach((button) => {
            button.addEventListener('click', () => {
                state.metric = button.dataset.metric;
                button.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
                renderBars();
            });
        });
        document.getElementById('tab-papers').addEventListener('click', () => showTab('papers'));
        document.getElementById('tab-network').addEventListener('click', () => showTab('network'));
        if (window.location.hash === '#network') showTab('network');

        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            if (window.innerWidth === lastWidth) return;
            lastWidth = window.innerWidth;
            clearTimeout(window.__pubResize);
            window.__pubResize = setTimeout(() => {
                renderBars();
                networkDirty = true;
                if (!document.getElementById('panel-network').hidden) renderNetwork();
            }, 200);
        });
    });
})();
