// Homepage "genome browser" hero: career as a chromosome, positions as gene
// features, awards as variant lollipops and papers as stacked reads.
// Reads window.CAREER (inlined by index.md from _data/career.yml and
// _data/publications.json). Rendered at the container's real pixel width so
// labels stay legible on phones; re-rendered on resize.

(function () {
  const data = window.CAREER;
  const host = document.getElementById('genome-track');
  if (!data || !host) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ERA_LABEL = { IITR: 'IIT Roorkee', Purdue: 'Purdue', OSU: 'Ohio State', NCI: 'NCI / NIH' };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const now = new Date();
  const nowValue = now.getFullYear() + now.getMonth() / 12;

  const toValue = (ym) => {
    if (!ym) return nowValue;
    const [y, m] = String(ym).split('-').map(Number);
    return y + ((m || 1) - 1) / 12;
  };
  const fmt = (v) => {
    const y = Math.floor(v);
    const m = Math.min(11, Math.round((v - y) * 12));
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]} ${y}`;
  };

  const positions = data.positions.map((p) => ({ ...p, from: toValue(p.start), to: toValue(p.end) }));
  const awards = data.awards.map((a) => ({ ...a, at: a.year + 0.5 }));
  const papers = data.papers
    .filter((p) => p.year)
    .map((p) => ({ ...p, at: p.year + ((p.month || 6) - 1) / 12 }))
    .sort((a, b) => a.at - b.at);

  const domainStart = Math.floor(Math.min(...positions.map((p) => p.from)));
  const domainEnd = nowValue + 0.6;

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    if (parent) parent.appendChild(node);
    return node;
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'gt-tooltip';
  tooltip.setAttribute('role', 'status');
  host.appendChild(tooltip);

  function showTip(html, event) {
    tooltip.innerHTML = html;
    tooltip.classList.add('visible');
    const box = host.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - box.left, 90), box.width - 90);
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${event.clientY - box.top - 12}px`;
  }
  const hideTip = () => tooltip.classList.remove('visible');

  function render() {
    host.querySelectorAll('svg').forEach((s) => s.remove());
    const width = host.clientWidth;
    const compact = width < 560;
    const gutter = compact ? 8 : 78;
    const right = 10;
    const x = (v) => gutter + ((v - domainStart) / (domainEnd - domainStart)) * (width - gutter - right);

    // Stack reads (papers) into rows so overlapping ones don't collide.
    const readWidth = Math.max(10, (width - gutter) / 70);
    const rows = [];
    papers.forEach((p) => {
      const px = x(p.at) - readWidth / 2;
      let row = rows.findIndex((end) => end < px - 1.5);
      if (row === -1) { row = rows.length; rows.push(0); }
      rows[row] = px + readWidth;
      p.row = row;
    });

    const readH = 5, readGap = 2;
    const layout = {
      ruler: 18,
      seq: 32,
      genes: 64,
      awards: 132,
      reads: 146,
    };
    const height = layout.reads + rows.length * (readH + readGap) + 12;

    const svg = el('svg', {
      width, height, viewBox: `0 0 ${width} ${height}`, class: 'gt-svg',
      role: 'img',
      'aria-label': `Career shown as a genome browser track from ${domainStart} to today: ${positions.length} positions, ${awards.length} awards and ${papers.length} publications.`,
    }, host);

    // Track labels
    if (!compact) {
      [['Positions', layout.genes + 4], ['Awards', layout.awards - 6], ['Papers', layout.reads + 8]].forEach(([label, y]) => {
        el('text', { x: 0, y, class: 'gt-track-label' }, svg).textContent = label;
      });
    }

    // Ruler: chromosome ideogram with alternating year bands
    const ruler = el('g', { class: 'gt-ruler' }, svg);
    el('rect', { x: gutter, y: layout.ruler - 4, width: width - gutter - right, height: 8, rx: 4, class: 'gt-chrom' }, ruler);
    const step = compact ? 3 : 1;
    for (let y = domainStart; y <= Math.floor(domainEnd); y++) {
      if ((y - domainStart) % 2 === 0) {
        el('rect', { x: x(y), y: layout.ruler - 4, width: Math.max(0, Math.min(x(y + 1), x(domainEnd)) - x(y)), height: 8, class: 'gt-band' }, ruler);
      }
      if ((y - domainStart) % step === 0) {
        el('text', { x: x(y) + 2, y: layout.ruler - 8, class: 'gt-tick' }, ruler).textContent = y;
      }
    }

    // Sequence strip: decorative bases scrolling under the ruler
    const seqGroup = el('g', { class: 'gt-seq', 'aria-hidden': 'true' }, svg);
    const bases = 'ATGCGTACCGATTAGCCTAGGCTAACGTTGCAATCGGATCCATGGCTAGTCAGTTACGGA';
    const seqText = el('text', { x: gutter, y: layout.seq, class: 'gt-seq-text' }, seqGroup);
    seqText.textContent = bases.repeat(Math.ceil(width / 260) + 2);
    const clip = el('clipPath', { id: 'gt-seq-clip' }, svg);
    el('rect', { x: gutter, y: layout.seq - 10, width: width - gutter - right, height: 14 }, clip);
    seqGroup.setAttribute('clip-path', 'url(#gt-seq-clip)');

    // Genes: one feature per position, with strand chevrons
    const genes = el('g', { class: 'gt-genes' }, svg);
    positions.forEach((p) => {
      const g = el('a', { href: p.url, class: 'gt-feature', 'data-era': p.era, style: `--delay:${((x(p.from) - gutter) / width) * 1.6}s` }, genes);
      const x0 = x(p.from), x1 = x(p.to);
      el('line', { x1: x0, x2: x1, y1: layout.genes, y2: layout.genes, class: 'gt-intron' }, g);
      el('rect', { x: x0, y: layout.genes - 8, width: Math.max(4, x1 - x0), height: 16, rx: 3, class: 'gt-exon' }, g);
      for (let cx = x0 + 10; cx < x1 - 6; cx += 16) {
        el('path', { d: `M${cx},${layout.genes - 3} l3,3 l-3,3`, class: 'gt-chevron' }, g);
      }
      const label = el('text', { x: (x0 + x1) / 2, y: layout.genes + 26, class: 'gt-gene-label' }, g);
      label.textContent = compact ? p.era.replace('Purdue', 'PU') : p.short;
      const tip = `<strong>${esc(p.title)}</strong><br>${esc(p.org)}<br><span>${fmt(p.from)} – ${p.end ? fmt(p.to) : 'present'}</span>`;
      g.addEventListener('mousemove', (e) => showTip(tip, e));
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('focus', () => showTip(tip, { clientX: host.getBoundingClientRect().left + (x0 + x1) / 2, clientY: host.getBoundingClientRect().top + layout.genes }));
      g.addEventListener('blur', hideTip);
      el('title', {}, g).textContent = `${p.title}, ${p.org}`;
    });

    // Awards: variant lollipops; awards in the same year fan out slightly
    const awardGroup = el('g', { class: 'gt-awards' }, svg);
    const perYear = {};
    awards.forEach((a) => {
      const i = (perYear[a.year] = (perYear[a.year] || 0) + 1) - 1;
      const ax = x(a.at) + i * 5;
      const g = el('g', { class: 'gt-variant', tabindex: 0, style: `--delay:${((ax - gutter) / width) * 1.6}s` }, awardGroup);
      el('line', { x1: ax, x2: ax, y1: layout.awards, y2: layout.awards - 12 - i * 5, class: 'gt-stem' }, g);
      el('circle', { cx: ax, cy: layout.awards - 14 - i * 5, r: 3.6, class: 'gt-head' }, g);
      const tip = `<strong>🏆 ${esc(a.title)}</strong><br>${esc(a.org)}<br><span>${a.year}</span>`;
      g.addEventListener('mousemove', (e) => showTip(tip, e));
      g.addEventListener('mouseleave', hideTip);
      g.addEventListener('click', () => { window.location.href = `/awards${a.anchor ? `#${a.anchor}` : ''}`; });
    });

    // Papers: stacked reads coloured by era
    const readGroup = el('g', { class: 'gt-reads' }, svg);
    papers.forEach((p) => {
      const rx = x(p.at) - readWidth / 2;
      const a = el('a', { href: `https://doi.org/${p.doi}`, target: '_blank', rel: 'noopener', class: 'gt-read', 'data-era': p.era, style: `--delay:${((rx - gutter) / width) * 1.6}s` }, readGroup);
      el('rect', { x: rx, y: layout.reads + p.row * (readH + readGap), width: readWidth, height: readH, rx: 1.5 }, a);
      const tip = `<strong>📄 ${esc(p.title)}</strong><br><em>${esc(p.journal)}</em> · ${p.year}`;
      a.addEventListener('mousemove', (e) => showTip(tip, e));
      a.addEventListener('mouseleave', hideTip);
    });

    // Cursor + locus readout: sweeps once on load, then follows the pointer
    const cursor = el('line', { x1: 0, x2: 0, y1: 4, y2: height - 4, class: 'gt-cursor' }, svg);
    const readout = document.getElementById('genome-locus');
    const eraAt = (v) => positions.find((p) => v >= p.from && v <= p.to);
    function moveCursor(px) {
      px = Math.min(px, x(nowValue));
      cursor.setAttribute('transform', `translate(${px},0)`);
      const v = Math.min(domainStart + ((px - gutter) / (width - gutter - right)) * (domainEnd - domainStart), nowValue);
      const era = eraAt(v);
      const isToday = nowValue - v < 1 / 24;
      if (readout) readout.textContent = `career:${isToday ? 'today' : fmt(Math.max(domainStart, v))} · ${era ? ERA_LABEL[era.era] : 'between positions'}`;
    }
    svg.addEventListener('pointermove', (e) => {
      const px = e.clientX - svg.getBoundingClientRect().left;
      if (px >= gutter) moveCursor(px);
    });

    if (reduceMotion || host.dataset.played) {
      svg.classList.add('gt-revealed');
      moveCursor(x(nowValue));
    } else {
      host.dataset.played = '1';
      const startTime = performance.now();
      const sweep = (t) => {
        const k = Math.min((t - startTime) / 1600, 1);
        moveCursor(gutter + (x(nowValue) - gutter) * (1 - Math.pow(1 - k, 2)));
        if (k < 1) requestAnimationFrame(sweep);
      };
      requestAnimationFrame(() => { svg.classList.add('gt-revealed'); requestAnimationFrame(sweep); });
    }

    const counts = document.getElementById('genome-counts');
    if (counts) counts.textContent = `${positions.length} positions · ${awards.length} awards · ${papers.length} publications`;
  }

  render();
  let resizeTimer;
  let lastWidth = host.clientWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (host.clientWidth !== lastWidth) { lastWidth = host.clientWidth; render(); }
    }, 150);
  });
})();
