---
layout: page
title: ""
css : "assets/css/landing.css"
---

<!-- Hero Section -->
<div class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">Samarth Mathur, PhD</h1>
    <p class="hero-welcome-banner">welcome to my personal website</p>
    <p class="hero-description">
      I am a <b> computational biologist </b> who work at the intersection of genomics and evolutionary biology to study the genetics of cancer. I develop rigorous <i>multi-omic</i> analyses to extract biological insight from complex, high-throughput biomedical data.
    </p>
  </div>
</div>

<!-- Stats: numbers come from _data/*.json, refreshed by .github/workflows/update-citations.yml -->
<div class="stats-grid">
  <div class="stat-card scroll-animate animate-scale animate-delay-1">
    <div class="stat-number" data-count-to="10" data-count-suffix="+">10+</div>
    <div class="stat-label">Years Experience</div>
  </div>

  <div class="stat-card scroll-animate animate-scale animate-delay-2">
    <div class="stat-number" data-count-to="{{ site.data.publications.size }}">{{ site.data.publications.size }}</div>
    <div class="stat-label">Publications</div>
  </div>

  <div class="stat-card scroll-animate animate-scale animate-delay-3">
    <div class="stat-number" data-count-to="{{ site.data.metrics.citations }}" data-count-suffix="+">{{ site.data.metrics.citations }}+</div>
    <div class="stat-label">Citations</div>
  </div>

  <div class="stat-card scroll-animate animate-scale animate-delay-4">
    <div class="stat-number" data-count-to="{{ site.data.metrics.h_index }}">{{ site.data.metrics.h_index }}</div>
    <div class="stat-label">h-index</div>
  </div>
</div>

<!-- Genome-browser view of my career (assets/js/genome-hero.js) -->
<div class="genome-browser scroll-animate animate-fade-up">
  <div class="genome-toolbar">
    <span class="genome-locus" id="genome-locus">career:{{ site.time | date: "%b %Y" }}</span>
    <span class="genome-counts" id="genome-counts"></span>
  </div>
  <div class="genome-track" id="genome-track"></div>
  <div class="genome-legend">
    <span><i style="background: var(--era-IITR)"></i>IIT Roorkee</span>
    <span><i style="background: var(--era-Purdue)"></i>Purdue</span>
    <span><i style="background: var(--era-OSU)"></i>Ohio State</span>
    <span><i style="background: var(--era-NCI)"></i>NCI / NIH</span>
    <span><i class="legend-award" style="background: var(--award)"></i>Award</span>
    <span class="genome-hint">Hover to inspect · click to open</span>
  </div>
</div>

<!-- CTA -->
<div class="scroll-animate animate-fade-up">
  <div class="button-container">
    <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
      <a href="summary" class="btn btn-primary">Learn More About Me</a>
      <a href="timeline" class="btn btn-primary">My Professional Journey</a>
      <a href="resume" class="btn btn-primary">My Resume</a>
    </div>
  </div>
</div>

<script>
// Scroll Animation Observer
document.addEventListener('DOMContentLoaded', function() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        // Optional: stop observing after animation
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with scroll-animate class
  const animatedElements = document.querySelectorAll('.scroll-animate');
  animatedElements.forEach(el => observer.observe(el));
});
</script>

<script>
window.CAREER = {
  positions: {{ site.data.career.positions | jsonify }},
  awards: {{ site.data.career.awards | jsonify }},
  papers: [{% for p in site.data.publications %}{"doi": {{ p.doi | jsonify }}, "title": {{ p.title | jsonify }}, "journal": {{ p.journal | jsonify }}, "year": {{ p.year | jsonify }}, "month": {{ p.month | jsonify }}, "era": {{ p.era | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}]
};
</script>
<script src="{{ '/assets/js/genome-hero.js' | relative_url }}"></script>
