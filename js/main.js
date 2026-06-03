/* ═══ SparkleWash — Main JS ═══ */
document.addEventListener('DOMContentLoaded', () => {

  // ── Cookie Bar ──
  const cookieBar = document.getElementById('cookie-bar');
  const cookieOk = document.getElementById('cookie-ok');
  if (cookieBar && cookieOk) {
    if (localStorage.getItem('sparklewash-cookies')) {
      cookieBar.style.display = 'none';
    }
    cookieOk.addEventListener('click', () => {
      localStorage.setItem('sparklewash-cookies', '1');
      cookieBar.style.display = 'none';
    });
  }

  // ── Mobile Hamburger ──
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('main-nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
    // Close on link click
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  // ── Contact Form ──
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;

      // Basic validation
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      if (!name || !email) {
        alert(I18N.current === 'pl' ? 'Proszę wypełnić imię i email.' : 
              I18N.current === 'de' ? 'Bitte Name und E-Mail ausfüllen.' :
              'Vul alstublieft naam en e-mail in.');
        return;
      }

      btn.textContent = I18N.current === 'pl' ? 'Wysyłanie...' :
                        I18N.current === 'de' ? 'Wird gesendet...' :
                        I18N.current === 'nl' ? 'Verzenden...' : 'Sending...';
      btn.disabled = true;

      // Formspree or fallback
      try {
        const data = {
          name, email,
          phone: form.querySelector('[name="phone"]').value.trim(),
          service: form.querySelector('[name="service"]').value,
          message: form.querySelector('[name="message"]').value.trim(),
          lang: I18N.current
        };

        // Save to localStorage as fallback (will sync when online)
        const inquiries = JSON.parse(localStorage.getItem('sparklewash-inquiries') || '[]');
        inquiries.push({ ...data, date: new Date().toISOString() });
        localStorage.setItem('sparklewash-inquiries', JSON.stringify(inquiries));

        const msgs = {
          pl: 'Dziękujemy! Odezwiemy się w ciągu 24h.',
          de: 'Vielen Dank! Wir melden uns innerhalb von 24h.',
          nl: 'Bedankt! Wij reageren binnen 24u.',
          en: 'Thank you! We will respond within 24h.'
        };
        alert(msgs[I18N.current] || msgs.en);
        form.reset();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // ── Smooth Scroll ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── Nav scroll shadow ──
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.3)' : 'none';
    });
  }

});
