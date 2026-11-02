// Site-wide behaviour: dark-mode toggle and count-up numbers.
// The initial theme is applied by an inline script in _includes/head.html
// so the page never flashes the wrong colours.

(function () {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function setTheme(theme) {
    root.classList.add('theme-transition');
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* private mode */ }
    setTimeout(() => root.classList.remove('theme-transition'), 400);
    document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }

  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.theme-toggle');
    if (!toggle) return;
    event.preventDefault();
    setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // Follow the OS setting until the visitor picks a theme themselves.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!storedTheme()) root.setAttribute('data-theme', event.matches ? 'dark' : 'light');
  });

  // ---- Count-up numbers ----------------------------------------------------
  // <span data-count-to="802" data-count-suffix="+">802+</span>
  // The final value is in the markup, so no-JS visitors still see it.
  function animateCount(el) {
    const target = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.countSuffix || '';
    if (isNaN(target) || reduceMotion) return;
    const duration = 1400;
    const start = performance.now();
    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    el.textContent = '0' + suffix;
    requestAnimationFrame(frame);
  }

  const countObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          countObserver.unobserve(entry.target);
          animateCount(entry.target);
        });
      }, { threshold: 0.4 })
    : null;

  window.initCountUps = function (scope) {
    (scope || document).querySelectorAll('[data-count-to]:not([data-count-bound])').forEach((el) => {
      el.setAttribute('data-count-bound', '');
      if (countObserver) countObserver.observe(el);
    });
  };

  document.addEventListener('DOMContentLoaded', () => window.initCountUps());
})();
