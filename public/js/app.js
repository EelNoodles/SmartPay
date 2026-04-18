(function () {
  'use strict';

  // --- Count-up for [data-countup] ---------------------------------
  // Starts at 0 and animates to the element's numeric content.
  function animateCountUp(el) {
    var target = parseFloat(el.getAttribute('data-countup'));
    if (isNaN(target)) return;
    var decimals = parseInt(el.getAttribute('data-countup-decimals') || '0', 10);
    var prefix   = el.getAttribute('data-countup-prefix') || '';
    var suffix   = el.getAttribute('data-countup-suffix') || '';
    var duration = parseInt(el.getAttribute('data-countup-duration') || '900', 10);
    var start = performance.now();
    function step(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      var value = target * eased;
      el.textContent = prefix + value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // --- Reveal on scroll for [data-reveal] --------------------------
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('animate-fade-up');
      if (el.hasAttribute('data-countup')) animateCountUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15 }) : null;

  function initReveal(root) {
    var nodes = (root || document).querySelectorAll('[data-reveal]');
    nodes.forEach(function (el, i) {
      el.style.animationDelay = (i * 60) + 'ms';
      if (io) io.observe(el); else el.classList.add('animate-fade-up');
    });
    // Count-up elements that are already visible without reveal animation
    var cus = (root || document).querySelectorAll('[data-countup]:not([data-reveal])');
    cus.forEach(function (el) { animateCountUp(el); });
  }

  // --- Loading state on form submit --------------------------------
  function initLoadingButtons() {
    document.querySelectorAll('form[data-loading]').forEach(function (form) {
      form.addEventListener('submit', function () {
        var btn = form.querySelector('button[type="submit"], button:not([type])');
        if (!btn) return;
        btn.classList.add('is-loading');
        btn.setAttribute('disabled', 'disabled');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initLoadingButtons();
  });

  // expose for pages that inject content dynamically
  window.SmartPay = { initReveal: initReveal, animateCountUp: animateCountUp };
})();
