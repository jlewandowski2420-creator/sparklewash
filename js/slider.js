/* ═══ SparkleWash — Before/After Slider ═══ */

function initBeforeAfterSliders() {
  const sliders = document.querySelectorAll('.ba-slider');

  sliders.forEach(slider => {
    const beforeEl = slider.querySelector('.ba-img-before');
    const afterEl = slider.querySelector('.ba-img-after');
    const handle = slider.querySelector('.ba-handle');
    const rect = slider.getBoundingClientRect();

    let isDragging = false;

    // ── Labels ──
    beforeEl.setAttribute('data-label-before', 'VOOR / PRZED');
    afterEl.setAttribute('data-label-after', 'NA / PO');

    // ── Update position (0-100%) ──
    function setPosition(pct) {
      pct = Math.max(0, Math.min(100, pct));
      afterEl.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      beforeEl.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = `${pct}%`;
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }

    // ── Get position from mouse/touch event ──
    function getPosition(e) {
      const rect = slider.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      return pct;
    }

    // ── Mouse events ──
    function onDragStart(e) {
      isDragging = true;
      handle.classList.add('dragging');
      const pct = getPosition(e);
      setPosition(pct);
      e.preventDefault();
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const pct = getPosition(e);
      setPosition(pct);
      e.preventDefault();
    }

    function onDragEnd() {
      if (isDragging) {
        isDragging = false;
        handle.classList.remove('dragging');
      }
    }

    // ── Attach mouse events on slider ──
    slider.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    // ── Touch events ──
    slider.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);

    // ── Click anywhere on slider to jump ──
    slider.addEventListener('click', function (e) {
      // Ignore clicks that initiated a drag
      // (handled by mousedown/touchstart + mouseup/touchend)
    });

    // ── Keyboard support ──
    handle.addEventListener('keydown', function (e) {
      const step = e.shiftKey ? 10 : 5;
      let cur = parseFloat(handle.style.left) || 50;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setPosition(cur + step);
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setPosition(cur - step);
        e.preventDefault();
      } else if (e.key === 'Home') {
        setPosition(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        setPosition(100);
        e.preventDefault();
      }
    });

    // ── Initialize at 50% ──
    setPosition(50);
  });
}

// Init on DOM ready and also on i18n page translate (in case sliders re-render)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBeforeAfterSliders);
} else {
  initBeforeAfterSliders();
}
