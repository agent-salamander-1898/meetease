const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load appointments from file
let appointments = [];
try {
  appointments = JSON.parse(fs.readFileSync(path.join(__dirname, 'appointments.json')));
} catch (err) {
  appointments = [];
}

function saveAppointments() {
  fs.writeFileSync(path.join(__dirname, 'appointments.json'), JSON.stringify(appointments, null, 2));
}

// Mail transporter
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for port 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Twilio client (optional)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// API endpoints
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', async (req, res) => {
  const { name, email, phone, date, time } = req.body;
  if (!name || !email || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const appointment = {
    id: Date.now(),
    name,
    email,
    phone: phone || null,
    date,
    time
  };
  appointments.push(appointment);
  saveAppointments();

  // send notifications
  try {
    // send confirmation email
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Meeting Confirmation',
      text: `Hi ${name},\n\nYour meeting is scheduled on ${date} at ${time}.\n\nThank you!`,
    });

    // optional SMS
    if (phone && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      await twilioClient.messages.create({
        body: `Hi ${name}, your meeting is scheduled on ${date} at ${time}.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });
    }
    res.json({ success: true, appointment });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
