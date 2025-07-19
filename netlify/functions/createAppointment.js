const nodemailer = require('nodemailer');
const twilio = require('twilio');

/*
 * Netlify Function: createAppointment
 *
 * This serverless function accepts POST requests with JSON payload containing
 * name, email, date, time and optionally phone. It sends a confirmation email
 * through ProtonMail SMTP and, if Twilio credentials are provided, an SMS
 * notification. Environment variables used:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }
  const { name, email, phone, date, time } = body;
  if (!name || !email || !date || !time) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  // Prepare nodemailer transporter
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Prepare Twilio client
  let twilioClient = null;
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  try {
    // Send confirmation email
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Meeting Confirmation',
      text: `Hi ${name},\n\nYour meeting is scheduled on ${date} at ${time}.\n\nThank you!`,
    });

    // Optional SMS notification
    if (phone && twilioClient) {
      await twilioClient.messages.create({
        body: `Hi ${name}, your meeting is scheduled on ${date} at ${time}.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Error in createAppointment:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to send notifications' })
    };
  }
};
