require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Glam Salon Server is running ✅');
});

app.post('/twilio', async (req, res) => {
  console.log('TWILIO DATA:', req.body);
  const customerPhone = req.body.From;
  const message = req.body.Body || 'missed call';
  const callStatus = req.body.CallStatus;
  const isMissedCall = callStatus === 'no-answer' || callStatus === 'busy';
  const task = isMissedCall
    ? `You are a receptionist for Glam Salon. Call this customer back and say: "Hi! This is Glam Salon calling you back. We noticed you just tried to reach us. How can we help you today?"`
    : `You are a receptionist for Glam Salon. Call this customer and say: "Hi! This is Glam Salon. We received your message: ${message}. How can we help you today?"`;
  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: customerPhone,
        task: task,
        model: 'base',
        language: 'en',
        voice: 'maya',
        max_duration: 2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Bland AI call queued:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
  res.sendStatus(200);
});

app.post('/reminder', async (req, res) => {
  const { phone, name, date, time } = req.body;
  const task = `You are a receptionist for Glam Salon. Say: "Hi ${name}! Reminder from Glam Salon, you have an appointment on ${date} at ${time}. See you soon!"`;
  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: phone,
        task: task,
        model: 'base',
        language: 'en',
        voice: 'maya',
        max_duration: 2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Reminder queued:', response.data);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/followup', async (req, res) => {
  const { phone, name } = req.body;
  const task = `You are a receptionist for Glam Salon. Say: "Hi ${name}! This is Glam Salon. We hope you loved your visit! We would love if you could leave us a Google review. Thank you!"`;
  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: phone,
        task: task,
        model: 'base',
        language: 'en',
        voice: 'maya',
        max_duration: 2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Follow-up queued:', response.data);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/lead', async (req, res) => {
  const { phone, name, service } = req.body;
  const task = `You are a receptionist for Glam Salon. Say: "Hi ${name}! This is Glam Salon. We saw you were interested in ${service || 'our services'}. We would love to book you in! When works best for you?"`;
  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: phone,
        task: task,
        model: 'base',
        language: 'en',
        voice: 'maya',
        max_duration: 2
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Lead call queued:', response.data);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/calendly', async (req, res) => {
  console.log('CALENDLY DATA:', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Glam Salon Server running on port ${PORT}`);
});
