// script.js
// Handles interactive behaviour on the scheduling form and makes API calls to book meetings.

document.addEventListener('DOMContentLoaded', () => {
  const smsCheckbox = document.getElementById('smsOpt');
  const phoneGroup = document.getElementById('phone-group');
  const bookingForm = document.getElementById('booking-form');
  const formMessage = document.getElementById('form-message');

  // Toggle phone number input visibility based on SMS opt-in
  if (smsCheckbox) {
    smsCheckbox.addEventListener('change', () => {
      if (smsCheckbox.checked) {
        phoneGroup.style.display = 'block';
        document.getElementById('phone').setAttribute('required', 'required');
      } else {
        phoneGroup.style.display = 'none';
        document.getElementById('phone').removeAttribute('required');
      }
    });
  }

  // Handle form submission
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      formMessage.textContent = '';
      formMessage.className = 'form-message';

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const smsOpt = smsCheckbox && smsCheckbox.checked;
      const phone = smsOpt ? document.getElementById('phone').value.trim() : '';

      // Basic validation
      if (!name || !email || !date || !time) {
        formMessage.textContent = 'Please fill in all required fields.';
        formMessage.classList.add('error');
        return;
      }
      if (smsOpt && !phone) {
        formMessage.textContent = 'Please enter your phone number for SMS notifications.';
        formMessage.classList.add('error');
        return;
      }

      const payload = { name, email, date, time };
      if (smsOpt) payload.phone = phone;

      try {
        // Send data to Netlify function endpoint
        const response = await fetch('/.netlify/functions/createAppointment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok && data.success) {
          // Show success message
          formMessage.textContent = 'Your meeting has been scheduled! A confirmation email has been sent.';
          formMessage.classList.add('success');
          bookingForm.reset();
          phoneGroup.style.display = 'none';
        } else {
          throw new Error(data.error || 'An unknown error occurred');
        }
      } catch (err) {
        formMessage.textContent = 'Failed to schedule meeting: ' + err.message;
        formMessage.classList.add('error');
      }
    });
  }
});
