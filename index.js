require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: '/etc/secrets/kindremind-f4dbba60ca18.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = '1VegegWVrzkqj-Jvntkz3zVUHUsfFSlCnr_Ar5aI3-OM';

async function saveToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:G',
    valueInputOption: 'RAW',
    resource: {
      values: [[
        new Date().toLocaleDateString(),
        new Date().toLocaleTimeString(),
        data.phone || '',
        data.message || '',
        data.name || '',
        data.service || '',
        'New'
      ]]
    }
  });
  console.log('✅ Saved to Google Sheets');
}

app.get('/', (req, res) => {
  res.send('Glam Salon Server is running ✅');
});

app.use(express.static(__dirname));

app.post('/twilio', async (req, res) => {
  console.log('TWILIO DATA:', req.body);
  const customerPhone = req.body.From;
  const message = req.body.Body || 'missed call';

  // Save to Google Sheets
  await saveToSheet({ phone: customerPhone, message: message });

  const task = `You are a receptionist for Glam Salon. Call this customer and say: "Hi! This is Glam Salon. We received your message: ${message}. How can we help you today?"`;

  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      { phone_number: customerPhone, task: task, model: 'base', language: 'en', voice: 'maya', max_duration: 2 },
      { headers: { 'Authorization': `Bearer ${process.env.BLAND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Bland AI call queued:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
  res.sendStatus(200);
});

app.post('/reminder', async (req, res) => {
  const { phone, name, date, time } = req.body;
  await saveToSheet({ phone, name, message: `Reminder for ${date} at ${time}` });
  const task = `You are a receptionist for Glam Salon. Say: "Hi ${name}! Reminder from Glam Salon, you have an appointment on ${date} at ${time}. See you soon!"`;
  try {
    await axios.post(
      'https://api.bland.ai/v1/calls',
      { phone_number: phone, task, model: 'base', language: 'en', voice: 'maya', max_duration: 2 },
      { headers: { 'Authorization': `Bearer ${process.env.BLAND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/followup', async (req, res) => {
  const { phone, name } = req.body;
  await saveToSheet({ phone, name, message: 'Follow-up review request' });
  const task = `You are a receptionist for Glam Salon. Say: "Hi ${name}! This is Glam Salon. We hope you loved your visit! We would love if you could leave us a Google review. Thank you!"`;
  try {
    await axios.post(
      'https://api.bland.ai/v1/calls',
      { phone_number: phone, task, model: 'base', language: 'en', voice: 'maya', max_duration: 2 },
      { headers: { 'Authorization': `Bearer ${process.env.BLAND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/lead', async (req, res) => {
  const { phone, name, service } = req.body;
  await saveToSheet({ phone, name, service, message: 'New lead' });
  const task = `You are a receptionist for Glam Salon. Say: "Hi ${name}! This is Glam Salon. We saw you were interested in ${service || 'our services'}. We would love to book you in! When works best for you?"`;
  try {
    await axios.post(
      'https://api.bland.ai/v1/calls',
      { phone_number: phone, task, model: 'base', language: 'en', voice: 'maya', max_duration: 2 },
      { headers: { 'Authorization': `Bearer ${process.env.BLAND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/calendly', async (req, res) => {
  console.log('CALENDLY DATA:', req.body);
  res.sendStatus(200);
});
app.post('/missed-call', async (req, res) => {
  console.log('MISSED CALL DATA:', req.body);
  const callerPhone = req.body.From;

  cconst task = `You are an AI booking assistant for KindRemind. When the person answers say: "Hi! This is KindRemind's AI assistant calling you back. I can help you book an appointment right now. What day and time works best for you?" Only discuss appointment booking. Do not offer to transfer or forward to any representative.`;
  
  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      { phone_number: callerPhone, task: task, model: 'base', language: 'en', voice: 'maya', max_duration: 2 },
      { headers: { 'Authorization': `Bearer ${process.env.BLAND_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    console.log('✅ Missed call callback queued:', response.data);
    await saveToSheet({ phone: callerPhone, name: 'Missed Call', message: 'Missed call - callback triggered', service: 'Missed Call Callback' });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Reject/></Response>`);
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Glam Salon Server running on port ${PORT}`);
});
