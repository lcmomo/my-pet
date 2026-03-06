/**
 * drag.js - Drag the pet wrapper
 * Attaches drag behavior to #pet-wrapper via mouse and touch events.
 */
(function () {
  var wrapper = document.getElementById('pet-wrapper');

  var dragging = false;
  var startX = 0, startY = 0;
  var origX = 0, origY = 0;

  function getPos() {
    var rect = wrapper.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  function onDown(e) {
    var t = e.target;
    if (t.closest && (t.closest('#chat-panel') || t.closest('#model-picker'))) return;
    dragging = true;
    var p = getPos();
    origX = p.x; origY = p.y;
    startX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    startY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    wrapper.style.transition = 'none';
    e.preventDefault();
  }

  function onMove(e) {
    var cx = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    var cy = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    var newX = origX + (cx - startX);
    var newY = origY + (cy - startY);
    var maxX = window.innerWidth  - wrapper.offsetWidth;
    var maxY = window.innerHeight - wrapper.offsetHeight;
    newX = Math.max(0, Math.min(maxX, newX));
    newY = Math.max(0, Math.min(maxY, newY));
    wrapper.style.position = 'fixed';
    wrapper.style.left   = newX + 'px';
    wrapper.style.top    = newY + 'px';
    wrapper.style.right  = 'auto';
    wrapper.style.bottom = 'auto';
  }


  wrapper.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  wrapper.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);
})();
