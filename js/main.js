/* ═══ SparkleWash — Main JS ═══ */
const FORMSPREE_ID = 'mqeopkrv';

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
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  // ── Helper: localized text ──
  function loc(nl, en, de, pl) {
    const c = typeof I18N !== 'undefined' ? I18N.current : 'nl';
    if (c === 'de') return de;
    if (c === 'en') return en;
    if (c === 'pl') return pl;
    return nl;
  }

  // ── Helper: submit to Formspree ──
  async function submitToFormspree(data, btn, form) {
    try {
      const resp = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (resp.ok) {
        form.reset();
        return { ok: true };
      } else {
        const err = await resp.json();
        return { ok: false, error: err.error || 'Formspree error' };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ── Price Calculator ──
  const calcCheckboxes = document.querySelectorAll('#calc-grid input[type="checkbox"]');
  const calcQty = document.getElementById('calc-qty');
  const calcTotalDisplay = document.getElementById('calc-total-display');
  const calcClear = document.getElementById('calc-clear');

  function updateCalcTotal() {
    let total = 0;
    calcCheckboxes.forEach(cb => {
      if (cb.checked) total += parseInt(cb.dataset.price, 10);
    });
    const qty = parseInt(calcQty ? calcQty.value : 1, 10) || 1;
    const grandTotal = total * qty;
    if (calcTotalDisplay) calcTotalDisplay.textContent = '\u20AC' + grandTotal;
  }

  if (calcCheckboxes.length) {
    calcCheckboxes.forEach(cb => cb.addEventListener('change', updateCalcTotal));
  }
  if (calcQty) calcQty.addEventListener('input', updateCalcTotal);
  if (calcClear) {
    calcClear.addEventListener('click', () => {
      calcCheckboxes.forEach(cb => { cb.checked = false; });
      if (calcQty) calcQty.value = 1;
      updateCalcTotal();
    });
  }

  // ── Booking Form → Formspree ──
  const bookingForm = document.getElementById('booking-form');
  const bookingSuccessMsg = document.getElementById('booking-success-msg');

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = bookingForm.querySelector('[name="b-name"]').value.trim();
      const email = bookingForm.querySelector('[name="b-email"]').value.trim();
      const phone = bookingForm.querySelector('[name="b-phone"]').value.trim();
      const service = bookingForm.querySelector('[name="b-service"]').value;
      const date = bookingForm.querySelector('[name="b-date"]').value;
      const time = bookingForm.querySelector('[name="b-time"]').value;

      if (!name || !email || !phone || !service || !date || !time) {
        alert(loc('Vul alle verplichte velden in.', 'Please fill in all required fields.', 'Bitte füllen Sie alle Pflichtfelder aus.', 'Proszę wypełnić wszystkie wymagane pola.'));
        return;
      }

      const btn = bookingForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = loc('Bezig...', 'Sending...', 'Wird gesendet...', 'Wysyłanie...');
      btn.disabled = true;

      const result = await submitToFormspree({
        _subject: 'Nieuwe boeking - SparkleWash',
        name, email, phone, service, date, time, lang: I18N.current,
        type: 'booking'
      }, btn, bookingForm);

      if (result.ok) {
        const successText = loc('Boeking ontvangen! Wij nemen binnen 24u contact met u op.', 'Booking received! We will contact you within 24h.', 'Buchung erhalten! Wir melden uns innerhalb von 24h.', 'Rezerwacja otrzymana! Skontaktujemy się w ciągu 24h.');
        if (bookingSuccessMsg) {
          bookingSuccessMsg.textContent = successText;
          bookingSuccessMsg.classList.add('show');
          setTimeout(() => bookingSuccessMsg.classList.remove('show'), 5000);
        } else {
          alert(successText);
        }
        bookingForm.reset();
      } else {
        alert(loc('Er is een fout opgetreden. Probeer het opnieuw of bel ons.', 'An error occurred. Please try again or call us.', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns an.', 'Wystąpił błąd. Spróbuj ponownie lub zadzwoń do nas.'));
      }

      btn.textContent = originalText;
      btn.disabled = false;
    });
  }

  // ── Animated Counter (Stats) ──
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = 2000;
    const startTime = performance.now();
    const isRating = el.dataset.target === '49';
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(eased * target);
      if (isRating) el.textContent = (currentVal / 10).toFixed(1) + '/5';
      else el.textContent = currentVal + '+';
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const numEl = entry.target.querySelector('.stat-number');
        if (numEl && !numEl.dataset.animated) {
          numEl.dataset.animated = '1';
          animateCounter(numEl);
        }
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.stat-card').forEach(card => statObserver.observe(card));

  // ── Scroll to Top ──
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('show', window.scrollY > 400);
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Contact Form → Formspree ──
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;

      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      if (!name || !email) {
        alert(loc('Vul alstublieft naam en e-mail in.', 'Please fill in name and email.', 'Bitte Name und E-Mail ausfüllen.', 'Proszę wypełnić imię i email.'));
        return;
      }

      btn.textContent = loc('Verzenden...', 'Sending...', 'Wird gesendet...', 'Wysyłanie...');
      btn.disabled = true;

      const result = await submitToFormspree({
        _subject: 'Nieuwe offerteaanvraag - SparkleWash',
        name, email,
        phone: form.querySelector('[name="phone"]').value.trim(),
        service: form.querySelector('[name="service"]').value,
        message: form.querySelector('[name="message"]').value.trim(),
        lang: I18N.current,
        type: 'contact'
      }, btn, form);

      if (result.ok) {
        // Also save local fallback
        const inquiries = JSON.parse(localStorage.getItem('sparklewash-inquiries') || '[]');
        inquiries.push({ name, email, date: new Date().toISOString() });
        localStorage.setItem('sparklewash-inquiries', JSON.stringify(inquiries));
        alert(loc('Bedankt! Wij reageren binnen 24u.', 'Thank you! We will respond within 24h.', 'Vielen Dank! Wir melden uns innerhalb von 24h.', 'Dziękujemy! Odezwiemy się w ciągu 24h.'));
      } else {
        alert(loc('Er is een fout opgetreden. Probeer het opnieuw of bel ons.', 'An error occurred. Please try again or call us.', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns an.', 'Wystąpił błąd. Spróbuj ponownie lub zadzwoń do nas.'));
      }

      btn.textContent = originalText;
      btn.disabled = false;
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

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const answer = q.nextElementSibling;
      if (!answer) return;
      const isOpen = answer.classList.contains('faq-answer-open');
      document.querySelectorAll('.faq-answer-open').forEach(a => {
        if (a !== answer) {
          a.classList.remove('faq-answer-open');
          a.style.maxHeight = '0';
          a.previousElementSibling?.classList.remove('faq-question-active');
        }
      });
      if (isOpen) {
        answer.classList.remove('faq-answer-open');
        answer.style.maxHeight = '0';
        q.classList.remove('faq-question-active');
      } else {
        answer.classList.add('faq-answer-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        q.classList.add('faq-question-active');
      }
    });
  });

  // ── Scroll Reveal ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── WhatsApp Button click tracking ──
  const waBtn = document.getElementById('whatsapp-button');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const clicks = parseInt(localStorage.getItem('sparklewash-wa-clicks') || '0');
      localStorage.setItem('sparklewash-wa-clicks', (clicks + 1).toString());
    });
  }

});
