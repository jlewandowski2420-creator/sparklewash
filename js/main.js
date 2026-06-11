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
      const expanded = nav.classList.contains('open');
      hamburger.setAttribute('aria-expanded', String(expanded));
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
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
  async function submitToFormspree(data) {
    try {
      const resp = await fetch('https://formspree.io/f/' + FORMSPREE_ID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      if (resp.ok) {
        return { ok: true };
      } else {
        const err = await resp.json();
        return { ok: false, error: err.error || 'Formspree error' };
      }
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  // ── Helper: populate time slots 10:00–20:30 ──
  function populateTimeSlots(selectEl) {
    while (selectEl.options.length > 1) selectEl.remove(1); // Clear dynamic options, keep placeholder
    for (var h = 10; h <= 20; h++) {
      for (var m = 0; m <= 30; m += 30) {
        if (h === 20 && m > 30) break;
        var hh = String(h).padStart(2, '0');
        var mm2 = String(m).padStart(2, '0');
        var opt = document.createElement('option');
        opt.value = hh + ':' + mm2;
        opt.textContent = hh + ':' + mm2;
        selectEl.appendChild(opt);
      }
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

  // Auto-sync calculator selections to booking form dropdown
  (function() {
    var bookingServiceSelect = document.querySelector('[name="b-service"]');
    if (!bookingServiceSelect) return;

    function syncCalcToBooking() {
      var checked = Array.from(calcCheckboxes).filter(function(cb) { return cb.checked; });
      var checkedValues = checked.map(function(cb) { return cb.dataset.service; });
      // Remove previously added composite options (beyond the original 7)
      while (bookingServiceSelect.options.length > 7) bookingServiceSelect.remove(7);
      if (checkedValues.length === 0) {
        bookingServiceSelect.value = '';
      } else if (checkedValues.length === 1) {
        bookingServiceSelect.value = checkedValues[0];
      } else {
        var names = checked.map(function(cb) {
          var labelEl = cb.parentElement.querySelector('span:not(.calc-price-label)');
          return labelEl ? labelEl.textContent.trim() : cb.dataset.service;
        }).join(' + ');
        var pkgLabel = (loc('Pakket','Package','Paket','Pakiet')) + ': ' + names;
        var opt = document.createElement('option');
        opt.value = checkedValues.join(',');
        opt.textContent = pkgLabel;
        bookingServiceSelect.appendChild(opt);
        bookingServiceSelect.value = checkedValues.join(',');
      }
    }

    if (calcCheckboxes.length) {
      calcCheckboxes.forEach(function(cb) {
        cb.addEventListener('change', syncCalcToBooking);
      });
    }

    if (calcClear) {
      calcClear.addEventListener('click', function() {
        // Run after DOM settles (checkboxes cleared by other handler)
        setTimeout(syncCalcToBooking, 0);
      });
    }
  })();
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
  const bookingDate = document.getElementById('booking-date');
  const bookingTime = document.getElementById('booking-time');

  // Set min date to today (no past dates)
  if (bookingDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    bookingDate.setAttribute('min', yyyy + '-' + mm + '-' + dd);

    // Open date picker when clicking anywhere on the field
    bookingDate.addEventListener('click', function() {
      try { this.showPicker(); } catch (_) {}
    });
  }

  // Populate time slots
  if (bookingTime) populateTimeSlots(bookingTime);

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = bookingForm.querySelector('[name="b-name"]').value.trim();
      const email = bookingForm.querySelector('[name="b-email"]').value.trim();
      const phone = bookingForm.querySelector('[name="b-phone"]').value.trim();
      const service = bookingForm.querySelector('[name="b-service"]').value;
      const date = bookingDate ? bookingDate.value : '';
      const time = bookingTime ? bookingTime.value : '';

      if (!name || !email || !phone || !service || !date || !time) {
        alert(loc('Vul alle verplichte velden in.', 'Please fill in all required fields.', 'Bitte füllen Sie alle Pflichtfelder aus.', 'Proszę wypełnić wszystkie wymagane pola.'));
        return;
      }

      // Double-check date isn't in the past (browser min only blocks date picker, not manual input)
      const selected = new Date(date + 'T' + time);
      if (selected < new Date()) {
        alert(loc('Kies een datum en tijd in de toekomst.', 'Please choose a future date and time.', 'Bitte wählen Sie ein Datum und eine Uhrzeit in der Zukunft.', 'Proszę wybrać datę i godzinę w przyszłości.'));
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
      });

      if (result.ok) {
        bookingForm.reset();
        // Re-populate time slots after reset
        if (bookingTime) populateTimeSlots(bookingTime);
        const successText = loc('Boeking ontvangen! Wij nemen binnen 24u contact met u op.', 'Booking received! We will contact you within 24h.', 'Buchung erhalten! Wir melden uns innerhalb von 24h.', 'Rezerwacja otrzymana! Skontaktujemy się w ciągu 24h.');
        if (bookingSuccessMsg) {
          bookingSuccessMsg.textContent = successText;
          bookingSuccessMsg.classList.add('show');
          setTimeout(() => bookingSuccessMsg.classList.remove('show'), 5000);
        } else {
          alert(successText);
        }
      } else {
        alert(loc('Er is een fout opgetreden. Probeer het opnieuw of bel ons.', 'An error occurred. Please try again or call us.', 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns an.', 'Wystąpił błąd. Spróbuj ponownie lub zadzwoń do nas.'));
      }

      btn.textContent = originalText;
      btn.disabled = false;
    });
  }

  // ── Animated Counter (Stats) ──
  function animateCounter(el) {
    const targetRaw = el.dataset.target;
    const target = parseFloat(targetRaw);
    if (isNaN(target)) return;
    const duration = 2000;
    const startTime = performance.now();
    const isDecimal = targetRaw.indexOf('.') !== -1;
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = eased * target;
      if (isDecimal) el.textContent = currentVal.toFixed(1) + ' / 5';
      else el.textContent = Math.round(currentVal) + '+';
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

  // ── Booking Wizard (multi-step) ──
  const wizard = document.getElementById('contact-form');
  if (wizard && wizard.classList.contains('booking-wizard')) {
    const steps = wizard.querySelectorAll('.wizard-step');
    const dots = wizard.querySelectorAll('.wizard-dot');
    const nextBtn = document.getElementById('wizard-next');
    const prevBtn = document.getElementById('wizard-prev');
    const restartBtn = document.getElementById('wizard-restart');
    const summaryEl = document.getElementById('wizard-summary');
    let currentStep = 0;

    function wLoc(nl, de, en, pl) { return loc(nl, en, de, pl); }

    function showStep(idx) {
      steps.forEach((s, i) => { s.classList.toggle('active', i === idx); });
      dots.forEach((d, i) => { d.classList.toggle('active', i <= idx); });
      prevBtn.hidden = idx === 0;
      if (idx === steps.length - 1) {
        nextBtn.textContent = wLoc('Versturen', 'Absenden', 'Submit', 'Wyślij');
        buildSummary();
      } else {
        nextBtn.textContent = wLoc('Volgende', 'Weiter', 'Next', 'Dalej');
      }
      currentStep = idx;
    }

    function validateStep(idx) {
      const errorEl = document.getElementById('wizard-error-' + (idx + 1));
      if (errorEl) errorEl.textContent = '';
      if (idx === 0) {
        const checked = wizard.querySelectorAll('[name="wizard-service"]:checked');
        if (checked.length === 0) {
          if (errorEl) errorEl.textContent = wLoc(
            'Selecteer minimaal één dienst.',
            'Bitte wählen Sie mindestens eine Dienstleistung.',
            'Please select at least one service.',
            'Wybierz co najmniej jedną usługę.'
          );
          return false;
        }
        return true;
      }
      if (idx === 1) {
        const fields = ['wizard-name', 'wizard-email', 'wizard-phone', 'wizard-address'];
        for (const fn of fields) {
          const f = wizard.querySelector('[name="' + fn + '"]');
          if (!f || !f.value.trim()) {
            if (errorEl) errorEl.textContent = wLoc(
              'Vul alle verplichte velden in.',
              'Bitte füllen Sie alle Pflichtfelder aus.',
              'Please fill in all required fields.',
              'Wypełnij wszystkie wymagane pola.'
            );
            return false;
          }
        }
        return true;
      }
      return true;
    }

    function buildSummary() {
      if (!summaryEl) return;
      const services = Array.from(wizard.querySelectorAll('[name="wizard-service"]:checked'))
        .map(cb => cb.parentElement.querySelector('.wizard-service-name').textContent.trim());
      const name = wizard.querySelector('[name="wizard-name"]').value.trim();
      const email = wizard.querySelector('[name="wizard-email"]').value.trim();
      const phone = wizard.querySelector('[name="wizard-phone"]').value.trim();
      const address = wizard.querySelector('[name="wizard-address"]').value.trim();
      summaryEl.innerHTML =
        '<p><strong>' + wLoc('Diensten:','Dienstleistungen:','Services:','Usługi:') + '</strong> ' + services.join(', ') + '</p>' +
        '<p><strong>' + wLoc('Naam:','Name:','Name:','Imię:') + '</strong> ' + name + '</p>' +
        '<p><strong>Email:</strong> ' + email + '</p>' +
        '<p><strong>' + wLoc('Telefoon:','Telefon:','Phone:','Telefon:') + '</strong> ' + phone + '</p>' +
        '<p><strong>' + wLoc('Adres:','Adresse:','Address:','Adres:') + '</strong> ' + address + '</p>';
    }

    nextBtn.addEventListener('click', async () => {
      if (!validateStep(currentStep)) return;
      if (currentStep < steps.length - 1) {
        showStep(currentStep + 1);
        return;
      }
      // Submit
      const services = Array.from(wizard.querySelectorAll('[name="wizard-service"]:checked'))
        .map(cb => cb.value).join(',');
      const data = {
        _subject: 'Nieuwe offerteaanvraag - SparkleWash',
        name: wizard.querySelector('[name="wizard-name"]').value.trim(),
        email: wizard.querySelector('[name="wizard-email"]').value.trim(),
        phone: wizard.querySelector('[name="wizard-phone"]').value.trim(),
        address: wizard.querySelector('[name="wizard-address"]').value.trim(),
        service: services,
        lang: I18N.current,
        type: 'wizard'
      };
      nextBtn.textContent = wLoc('Verzenden...','Senden...','Sending...','Wysyłanie...');
      nextBtn.disabled = true;
      const result = await submitToFormspree(data);
      nextBtn.disabled = false;
      if (result.ok) {
        showStep(2);
        // Also save local fallback
        const inquiries = JSON.parse(localStorage.getItem('sparklewash-inquiries') || '[]');
        inquiries.push({ name: data.name, email: data.email, date: new Date().toISOString() });
        localStorage.setItem('sparklewash-inquiries', JSON.stringify(inquiries));
      } else {
        const errorEl = document.getElementById('wizard-error-2');
        if (errorEl) errorEl.textContent = wLoc(
          'Fout bij verzenden. Probeer opnieuw of bel ons.',
          'Fehler beim Senden. Bitte versuchen Sie es erneut oder rufen Sie uns an.',
          'Error sending. Please try again or call us.',
          'Błąd wysyłania. Spróbuj ponownie lub zadzwoń.'
        );
        nextBtn.textContent = wLoc('Versturen', 'Absenden', 'Submit', 'Wyślij');
      }
    });

    prevBtn.addEventListener('click', () => {
      if (currentStep > 0) showStep(currentStep - 1);
    });

    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        wizard.reset();
        showStep(0);
      });
    }
  }

  // ── Contact Form (legacy — kept if booking wizard not present) ──
  const form = document.getElementById('contact-form');
  if (form && !form.classList.contains('booking-wizard')) {
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
      });

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
