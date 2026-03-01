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
      I work at the intersection of computational genomics and evolutionary biology to study the genetics of cancer. I develop rigorous <i>multi-omic</i> analyses to extract biological insight from complex, high-throughput biomedical data.
    </p>
  </div>
</div>

<!-- Stats Section - Compact Single Line -->
<div class="stats-grid">
  <div class="stat-card scroll-animate animate-scale animate-delay-1">
    <div class="stat-number">9+</div>
    <div class="stat-label">Years Experience</div>
  </div>

  <div class="stat-card scroll-animate animate-scale animate-delay-2">
    <div class="stat-number">20+</div>
    <div class="stat-label">Publications</div>
  </div>

  <div class="stat-card scroll-animate animate-scale animate-delay-3">
    <div class="stat-number">700+</div>
    <div class="stat-label">Citations</div>
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
