(function () {
  var root = document.getElementById('sterbegeld-widget');
  if (!root) return;

  function syncWidgetFitWidth() {
    var availableWidth = window.innerWidth || document.documentElement.clientWidth || 720;
    var node = root.parentElement;

    while (node && node !== document.documentElement) {
      var rect = node.getBoundingClientRect();
      if (rect.width > 0) {
        availableWidth = Math.min(availableWidth, rect.width);
      }
      node = node.parentElement;
    }

    root.style.setProperty('--widget-fit-width', Math.max(280, Math.floor(availableWidth - 24)) + 'px');
  }

  var steps = root.querySelectorAll('.step');
  var progressBar = root.querySelector('.progress-bar');
  var back2 = root.querySelector('.back-2');
  var back3 = root.querySelector('.back-3');
  var back4 = root.querySelector('.back-4');
  var recipientSummary = root.querySelector('#sg-recipient');
  var coverageSummary = root.querySelector('#sg-coverage');
  var submitBtn = root.querySelector('#sg-submit');
  var messageBox = root.querySelector('#sg-message');

  var dateFields = [
    {
      input: root.querySelector('#sg-day'),
      error: root.querySelector('#sg-day-error'),
      emptyMessage: 'Bitte gib einen Tag an.',
      invalidMessage: 'Bitte gib einen gültigen Tag an.'
    },
    {
      input: root.querySelector('#sg-month'),
      error: root.querySelector('#sg-month-error'),
      emptyMessage: 'Bitte gib einen Monat an.',
      invalidMessage: 'Bitte gib einen gültigen Monat an.'
    },
    {
      input: root.querySelector('#sg-year'),
      error: root.querySelector('#sg-year-error'),
      emptyMessage: 'Bitte gib ein Jahr an.',
      invalidMessage: 'Bitte gib ein gültiges Jahr an.'
    }
  ];

  function fillTrackingFields() {
    var params = new URLSearchParams(window.location.search);

    root.querySelector('#sg-utm-source').value = params.get('utm_source') || 'direkt';
    root.querySelector('#sg-utm-medium').value = params.get('utm_medium') || 'direkt';
    root.querySelector('#sg-utm-campaign').value = params.get('utm_campaign') || 'direkt';
    root.querySelector('#sg-utm-term').value = params.get('utm_term') || '';
    root.querySelector('#sg-utm-content').value = params.get('utm_content') || '';
    root.querySelector('#sg-utm-source-platform').value = params.get('utm_source_platform') || '';
    root.querySelector('#sg-gclid').value = params.get('gclid') || '';
    root.querySelector('#sg-fbclid').value = params.get('fbclid') || '';
  }

  function showMessage(type, text) {
    if (!messageBox) return;

    messageBox.className = 'form-message ' + type;
    messageBox.textContent = text;
  }

  function clearMessage() {
    if (!messageBox) return;

    messageBox.className = 'form-message';
    messageBox.textContent = '';
  }

  function showStep(stepNumber) {
    root.setAttribute('data-current-step', String(stepNumber));

    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('active-step');
    }

    var current = root.querySelector('.step-' + stepNumber);
    if (current) current.classList.add('active-step');

    progressBar.style.width = (stepNumber * 25) + '%';

    if (back2) back2.classList.remove('active-back');
    if (back3) back3.classList.remove('active-back');
    if (back4) back4.classList.remove('active-back');

    if (stepNumber === 2 && back2) back2.classList.add('active-back');
    if (stepNumber === 3 && back3) back3.classList.add('active-back');
    if (stepNumber === 4 && back4) back4.classList.add('active-back');
  }

  function setDateFieldError(field, hasError, message) {
    if (!field.input || !field.error) return;

    var messageTarget = field.error.querySelector('span:last-child');
    if (messageTarget && message) messageTarget.textContent = message;

    field.input.classList.toggle('is-invalid', hasError);
    field.input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    field.error.classList.toggle('active-error', hasError);
  }

  function validateDateFields() {
    var isValid = true;
    var values = [];

    for (var i = 0; i < dateFields.length; i++) {
      var field = dateFields[i];
      var value = field.input ? field.input.value.trim() : '';
      values.push(value);

      if (value === '') {
        setDateFieldError(field, true, field.emptyMessage);
        isValid = false;
      } else if (!/^\d+$/.test(value)) {
        setDateFieldError(field, true, field.invalidMessage);
        isValid = false;
      } else {
        setDateFieldError(field, false);
      }
    }

    if (isValid) {
      var day = Number(values[0]);
      var month = Number(values[1]);
      var year = Number(values[2]);
      var currentYear = new Date().getFullYear();
      var date = new Date(year, month - 1, day);

      var hasValidDay = day >= 1 && day <= 31;
      var hasValidMonth = month >= 1 && month <= 12;
      var hasValidYear = values[2].length === 4 && year >= 1900 && year <= currentYear;
      var isRealDate =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;

      if (!hasValidDay || (hasValidMonth && hasValidYear && !isRealDate)) {
        setDateFieldError(dateFields[0], true, 'Bitte gib einen gültigen Tag an.');
        isValid = false;
      }

      if (!hasValidMonth) {
        setDateFieldError(dateFields[1], true, 'Bitte gib einen gültigen Monat an.');
        isValid = false;
      }

      if (!hasValidYear) {
        setDateFieldError(dateFields[2], true, 'Bitte gib ein gültiges Jahr an.');
        isValid = false;
      }
    }

    return isValid;
  }

  function bindDateFieldCleanup() {
    for (var i = 0; i < dateFields.length; i++) {
      if (dateFields[i].input) {
        dateFields[i].input.addEventListener('input', function (event) {
          event.target.value = event.target.value.replace(/\D/g, '');

          var field = null;
          for (var j = 0; j < dateFields.length; j++) {
            if (dateFields[j].input === event.target) {
              field = dateFields[j];
              break;
            }
          }

          if (field && event.target.value.trim() !== '') {
            setDateFieldError(field, false);
          }
        });
      }
    }
  }

  function bindChoiceLinks(selector, targetStep, summaryElement) {
    var links = root.querySelectorAll(selector);

    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (event) {
        event.preventDefault();

        for (var j = 0; j < links.length; j++) {
          links[j].classList.remove('selected');
        }

        event.currentTarget.classList.add('selected');

        var title = event.currentTarget.querySelector('.title');
        if (summaryElement && title) {
          summaryElement.textContent = title.textContent.trim();
        }

        showStep(targetStep);
      });
    }
  }

  function setInputInvalid(input, isInvalid) {
    if (!input) return;
    input.classList.toggle('is-invalid', isInvalid);
  }

  function setConsentInvalid(isInvalid) {
    var consent = root.querySelector('#sg-consent');
    var consentError = root.querySelector('#sg-consent-error');

    if (consent) {
      consent.classList.toggle('is-invalid', isInvalid);
      consent.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
    }

    if (consentError) {
      consentError.classList.toggle('active-error', isInvalid);
    }
  }

  function validateConsent() {
    var consent = root.querySelector('#sg-consent');
    var isValid = !!(consent && consent.checked);

    setConsentInvalid(!isValid);
    return isValid;
  }

  function bindConsentCleanup() {
    var consent = root.querySelector('#sg-consent');
    if (!consent) return;

    consent.addEventListener('change', function () {
      if (consent.checked) {
        setConsentInvalid(false);
      }
    });
  }

  function validateContactFields() {
    var vorname = root.querySelector('#sg-vorname');
    var nachname = root.querySelector('#sg-nachname');
    var strasse = root.querySelector('#sg-strasse');
    var plz = root.querySelector('#sg-plz');
    var ort = root.querySelector('#sg-ort');
    var telefon = root.querySelector('#sg-telefon');
    var email = root.querySelector('#sg-email');

    var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    var phoneValid = telefon.value.replace(/\D/g, '').length >= 6;
    var plzValid = /^\d{5}$/.test(plz.value.trim());

    setInputInvalid(vorname, vorname.value.trim() === '');
    setInputInvalid(nachname, nachname.value.trim() === '');
    setInputInvalid(strasse, strasse.value.trim() === '');
    setInputInvalid(plz, !plzValid);
    setInputInvalid(ort, ort.value.trim() === '');
    setInputInvalid(telefon, !phoneValid);
    setInputInvalid(email, !emailValid);

    return (
      vorname.value.trim() !== '' &&
      nachname.value.trim() !== '' &&
      strasse.value.trim() !== '' &&
      plzValid &&
      ort.value.trim() !== '' &&
      phoneValid &&
      emailValid
    );
  }

  function buildEmailParams() {
    var day = root.querySelector('#sg-day').value.trim().padStart(2, '0');
    var month = root.querySelector('#sg-month').value.trim().padStart(2, '0');
    var year = root.querySelector('#sg-year').value.trim();

    var vorname = root.querySelector('#sg-vorname').value.trim();
    var nachname = root.querySelector('#sg-nachname').value.trim();
    var email = root.querySelector('#sg-email').value.trim();

    return {
      sterbegeld_empfaenger: recipientSummary.textContent.trim(),
      sterbegeld_summe: coverageSummary.textContent.trim(),

      vorname: vorname,
      name: nachname,
      telefonnummer: root.querySelector('#sg-telefon').value.trim(),
      strasse_hausnummer: root.querySelector('#sg-strasse').value.trim(),
      postleitzahl: root.querySelector('#sg-plz').value.trim(),
      ort: root.querySelector('#sg-ort').value.trim(),
      geburtsdatum: day + '.' + month + '.' + year,
      email: email,

      to_email: email,
      to_name: vorname + ' ' + nachname,

      utm_source: root.querySelector('#sg-utm-source').value,
      utm_medium: root.querySelector('#sg-utm-medium').value,
      utm_campaign: root.querySelector('#sg-utm-campaign').value,
      utm_term: root.querySelector('#sg-utm-term').value,
      utm_content: root.querySelector('#sg-utm-content').value,
      utm_platform: root.querySelector('#sg-utm-source-platform').value,
      gclid: root.querySelector('#sg-gclid').value,
      fbclid: root.querySelector('#sg-fbclid').value,

      website: root.querySelector('#sg-website').value.trim(),
      page_url: window.location.href,
      consent_accepted: 'ja',
      consent_timestamp: new Date().toISOString(),
      consent_text_version: 'bestattungsvorsorge_multistep_v1'
    };
  }

  function bindSubmit() {
    if (!submitBtn) return;

    submitBtn.addEventListener('click', function () {
      clearMessage();

      var honeypot = root.querySelector('#sg-website');
      if (honeypot && honeypot.value.trim() !== '') {
        return;
      }

      var dateValid = validateDateFields();
      var contactValid = validateContactFields();
      var consentValid = validateConsent();

      if (!dateValid || !contactValid || !consentValid) {
        showMessage('error', 'Bitte füllen Sie alle Pflichtfelder korrekt aus.');
        return;
      }

      var params = buildEmailParams();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Wird gesendet...';

      var apiUrl = window.STERBEGELD_API_URL || '/api/lead';

      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Submission failed');
          }

          return response.json();
        })
        .then(function () {
          var submitRow = submitBtn.closest('.cta-row');
          if (submitRow) {
            submitRow.style.display = 'none';
          }

          showMessage('success', 'Vielen Dank! Ihre Anfrage wurde erfolgreich gesendet.');
        })
        .catch(function (error) {
          console.error('EmailJS Fehler:', error);
          var submitRow = submitBtn.closest('.cta-row');
          if (submitRow) {
            submitRow.style.display = 'none';
          }

          showMessage('error', 'Fehler beim Senden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.');
        });
    });
  }

  bindChoiceLinks('a.person-card[href="#sg-view-2"]', 2, recipientSummary);
  bindChoiceLinks('a.money-card[href="#sg-view-3"]', 3, coverageSummary);

  var dateNextLinks = root.querySelectorAll('a[href="#sg-view-4"]');
  for (var i = 0; i < dateNextLinks.length; i++) {
    dateNextLinks[i].addEventListener('click', function (event) {
      event.preventDefault();

      if (validateDateFields()) {
        showStep(4);
      }
    });
  }

  if (back2) {
    back2.addEventListener('click', function (event) {
      event.preventDefault();
      showStep(1);
    });
  }

  if (back3) {
    back3.addEventListener('click', function (event) {
      event.preventDefault();
      showStep(2);
    });
  }

  if (back4) {
    back4.addEventListener('click', function (event) {
      event.preventDefault();
      showStep(3);
    });
  }

  fillTrackingFields();
  syncWidgetFitWidth();
  window.addEventListener('resize', syncWidgetFitWidth);
  window.addEventListener('orientationchange', syncWidgetFitWidth);

  if (window.ResizeObserver && root.parentElement) {
    new ResizeObserver(syncWidgetFitWidth).observe(root.parentElement);
  }

  bindDateFieldCleanup();
  bindConsentCleanup();
  bindSubmit();
  showStep(1);
})();
