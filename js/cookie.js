// Cookie consent bar
(function() {
  const bar = document.getElementById('cookie-bar');
  const ok = document.getElementById('cookie-ok');
  const reject = document.getElementById('cookie-reject');
  if (!bar || !ok) return;
  if (localStorage.getItem('cookie-consent')) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  ok.addEventListener('click', () => { localStorage.setItem('cookie-consent', '1'); bar.style.display = 'none'; });
  if (reject) reject.addEventListener('click', () => { bar.style.display = 'none'; });
})();
