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

  // ── Price Calculator ──
  const calcCheckboxes = document.querySelectorAll('#calc-grid input[type="checkbox"]');
  const calcQty = document.getElementById('calc-qty');
  const calcTotalDisplay = document.getElementById('calc-total-display');
  const calcClear = document.getElementById('calc-clear');

  function updateCalcTotal() {
    let total = 0;
    calcCheckboxes.forEach(cb => {
      if (cb.checked) {
        total += parseInt(cb.dataset.price, 10);
      }
    });
    const qty = parseInt(calcQty ? calcQty.value : 1, 10) || 1;
    const grandTotal = total * qty;
    if (calcTotalDisplay) {
      calcTotalDisplay.textContent = '\u20AC' + grandTotal;
    }
  }

  if (calcCheckboxes.length) {
    calcCheckboxes.forEach(cb => {
      cb.addEventListener('change', updateCalcTotal);
    });
  }
  if (calcQty) {
    calcQty.addEventListener('input', updateCalcTotal);
  }
  if (calcClear) {
    calcClear.addEventListener('click', () => {
      calcCheckboxes.forEach(cb => { cb.checked = false; });
      if (calcQty) calcQty.value = 1;
      updateCalcTotal();
    });
  }

  // ── Booking Form (localStorage) ──
  const bookingForm = document.getElementById('booking-form');
  const bookingSuccessMsg = document.getElementById('booking-success-msg');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = bookingForm.querySelector('[name="b-name"]').value.trim();
      const email = bookingForm.querySelector('[name="b-email"]').value.trim();
      const phone = bookingForm.querySelector('[name="b-phone"]').value.trim();
      const service = bookingForm.querySelector('[name="b-service"]').value;
      const date = bookingForm.querySelector('[name="b-date"]').value;
      const time = bookingForm.querySelector('[name="b-time"]').value;

      if (!name || !email || !phone || !service || !date || !time) {
        const msg = I18N.current === 'pl' ? 'Proszę wypełnić wszystkie wymagane pola.' :
                    I18N.current === 'de' ? 'Bitte füllen Sie alle Pflichtfelder aus.' :
                    I18N.current === 'nl' ? 'Vul alstublieft alle verplichte velden in.' :
                    'Please fill in all required fields.';
        alert(msg);
        return;
      }

      const booking = {
        name, email, phone, service, date, time,
        created: new Date().toISOString()
      };

      const bookings = JSON.parse(localStorage.getItem('sparklewash-bookings') || '[]');
      bookings.push(booking);
      localStorage.setItem('sparklewash-bookings', JSON.stringify(bookings));

      // Show success
      const successText = I18N.current === 'pl' ? 'Rezerwacja zapisana! Skontaktujemy się w ciągu 24h.' :
                          I18N.current === 'de' ? 'Buchung gespeichert! Wir melden uns innerhalb von 24h.' :
                          I18N.current === 'nl' ? 'Boeking opgeslagen! Wij nemen binnen 24u contact met u op.' :
                          'Booking saved! We will contact you within 24h.';
      if (bookingSuccessMsg) {
        bookingSuccessMsg.textContent = successText;
        bookingSuccessMsg.classList.add('show');
        setTimeout(() => bookingSuccessMsg.classList.remove('show'), 5000);
      } else {
        alert(successText);
      }

      bookingForm.reset();
    });
  }

  // ── Animated Counter (Stats) ──
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    const duration = 2000; // ms
    const startTime = performance.now();

    // For rating (4.9), we store target 49 and divide by 10
    const isRating = el.dataset.target === '49';
    const finalVal = isRating ? 4.9 : target;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(eased * target);
      if (isRating) {
        el.textContent = (currentVal / 10).toFixed(1) + '/5';
      } else {
        el.textContent = currentVal + '+';
      }
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // Set up intersection observer for stat counters
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

  // ── Scroll to Top Button ──
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('show');
      } else {
        scrollTopBtn.classList.remove('show');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const answer = q.nextElementSibling;
      if (!answer) return;
      const isOpen = answer.classList.contains('faq-answer-open');
      // Close all others
      document.querySelectorAll('.faq-answer-open').forEach(a => {
        if (a !== answer) {
          a.classList.remove('faq-answer-open');
          a.style.maxHeight = '0';
          a.previousElementSibling?.classList.remove('faq-question-active');
        }
      });
      // Toggle this one
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

  // ── Scroll Reveal (Intersection Observer) ──
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
      console.log('[SparkleWash] WhatsApp button clicked');
      const clicks = parseInt(localStorage.getItem('sparklewash-wa-clicks') || '0');
      localStorage.setItem('sparklewash-wa-clicks', (clicks + 1).toString());
    });
  }

});
