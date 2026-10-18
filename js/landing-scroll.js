/* Savourkin scroll landing. The page is complete without this file:
   it only adds scroll-linked motion where motion is allowed. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();
  // The sticky nav covers the top of the viewport, so pinned content centres below it.
  function navHeight() {
    var nav = document.querySelector('.nav');
    return nav ? nav.offsetHeight : 0;
  }

  mm.add({
    desktop: '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    mobile: '(max-width: 899px) and (prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var desktop = ctx.conditions.desktop;
    var undo = [assemblePlate(desktop), desktop && scrollDishes()];
    fillWeek();
    return function () { undo.forEach(function (fn) { if (fn) fn(); }); };
  });

  // Each ingredient joins the plate while the ledger row lights up and the
  // total steps to the cumulative value stored on that row. Totals only ever
  // show sourced values (0, 207, 329, 554, 594), never interpolated numbers.
  function assemblePlate(desktop) {
    var section = document.querySelector('.assemble');
    if (!section) return;
    var rows = gsap.utils.toArray('.ledger-row', section);
    var foods = gsap.utils.toArray('.plate-food', section);
    var totalEl = section.querySelector('.lt-n');
    var macros = section.querySelector('.lt-macros');
    var shown = null;

    function show(step) {
      if (step === shown) return;
      shown = step;
      rows.forEach(function (row, i) { row.classList.toggle('is-on', i === step); });
      totalEl.textContent = step < 0 ? '0' : rows[step].getAttribute('data-total');
    }

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: desktop
        ? { trigger: '.assemble-stage', start: function () { return 'center ' + (navHeight() + (innerHeight - navHeight()) / 2) + 'px'; }, end: '+=' + rows.length * 70 + '%', scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
        : { trigger: section.querySelector('.ledger-rows'), start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
      onUpdate: function () {
        var t = tl.time();
        var step = -1;
        rows.forEach(function (_, i) { if (t >= tl.labels['food' + i]) step = i; });
        show(step);
      }
    });

    tl.from(macros, { autoAlpha: 0.35, duration: 0.01 }, 0);
    foods.forEach(function (food, i) {
      var fromLeft = i === 0 || i === 3;
      tl.addLabel('food' + i, i + 0.5)
        .from(food, { x: fromLeft ? -80 : 80, scale: 0.6, autoAlpha: 0, duration: 0.5 }, i);
    });
    tl.to(macros, { autoAlpha: 1, duration: 0.3 }, rows.length - 0.3)
      .to({}, { duration: 0.4 });
    show(-1);
    return function () {
      rows.forEach(function (row) { row.classList.remove('is-on'); });
      totalEl.textContent = rows[rows.length - 1].getAttribute('data-total');
    };
  }

  // Desktop: the dish strip moves sideways while the section is pinned.
  function scrollDishes() {
    var section = document.querySelector('.dishes');
    var track = section && section.querySelector('.dish-track');
    if (!track) return;
    section.classList.add('js-hscroll');
    var distance = function () {
      var vp = section.querySelector('.dish-viewport');
      var pad = parseFloat(getComputedStyle(vp).paddingLeft) || 0;
      return Math.max(0, track.scrollWidth - (vp.clientWidth - pad * 2));
    };
    gsap.to(track, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: function () { return 'top ' + navHeight() + 'px'; },
        end: function () { return '+=' + distance(); },
        scrub: 0.6,
        pin: '.dish-pin',
        invalidateOnRefresh: true
      }
    });
    return function () { section.classList.remove('js-hscroll'); };
  }

  // The week rule fills as the three steps pass the middle of the screen.
  function fillWeek() {
    var steps = document.querySelector('.week-steps');
    if (!steps) return;
    gsap.fromTo(steps, { '--fill': 0 }, {
      '--fill': 1,
      ease: 'none',
      scrollTrigger: { trigger: steps, start: 'top 60%', end: 'bottom 60%', scrub: true }
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
