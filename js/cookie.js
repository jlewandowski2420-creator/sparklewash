// SparkleWash cookie consent and consent-gated analytics.
(function () {
  'use strict';

  const CONSENT_KEY = 'sparklewash-cookie-consent';
  const LEGACY_KEY = 'cookie-consent';
  const ANALYTICS_ID = '248597f5';

  function getConsent() {
    try {
      const current = localStorage.getItem(CONSENT_KEY);
      if (current === 'accepted' || current === 'rejected') return current;
      if (localStorage.getItem(LEGACY_KEY) === '1') {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        localStorage.removeItem(LEGACY_KEY);
        return 'accepted';
      }
    } catch (_) {
      // If storage is unavailable, keep analytics disabled and show the choice.
    }
    return null;
  }

  function setConsent(value) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
      localStorage.removeItem(LEGACY_KEY);
    } catch (_) {
      // The choice applies for this page only when storage is unavailable.
    }
  }

  function loadAnalytics() {
    if (document.querySelector('script[data-sparklewash-analytics]')) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://cloud.umami.is/script.js';
    script.dataset.websiteId = ANALYTICS_ID;
    script.dataset.doNotTrack = 'true';
    script.dataset.domains = 'sparklewash.nl';
    script.dataset.sparklewashAnalytics = 'true';
    document.head.appendChild(script);
  }

  function createBar() {
    const bar = document.createElement('div');
    bar.id = 'cookie-bar';
    bar.className = 'cookie-bar';
    bar.innerHTML = '<p>Met uw toestemming gebruiken wij privacyvriendelijke Umami-analytics om de website te verbeteren. <a href="privacy.html#cookies" style="color:var(--accent);text-decoration:underline;">Lees meer</a></p>' +
      '<div class="cookie-buttons">' +
      '<button id="cookie-reject" class="cookie-btn cookie-btn-reject" type="button">Weigeren</button>' +
      '<button id="cookie-ok" class="cookie-btn cookie-btn-accept" type="button">Accepteren</button>' +
      '</div>';
    document.body.appendChild(bar);
    return bar;
  }

  function initialize() {
    const bar = document.getElementById('cookie-bar') || createBar();
    const accept = document.getElementById('cookie-ok');
    const reject = document.getElementById('cookie-reject');
    const settings = document.getElementById('cookie-settings');

    function showBar() {
      bar.style.display = 'block';
      if (accept) accept.focus();
    }

    function hideBar() {
      bar.style.display = 'none';
    }

    if (accept) {
      accept.addEventListener('click', function () {
        setConsent('accepted');
        hideBar();
        loadAnalytics();
      });
    }

    if (reject) {
      reject.addEventListener('click', function () {
        setConsent('rejected');
        hideBar();
      });
    }

    if (settings) {
      settings.addEventListener('click', function () {
        setConsent('rejected');
        showBar();
      });
    }

    const consent = getConsent();
    if (consent === 'accepted') {
      hideBar();
      loadAnalytics();
    } else if (consent === 'rejected') {
      hideBar();
    } else {
      showBar();
    }

    window.openSparkleWashCookieSettings = showBar;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
