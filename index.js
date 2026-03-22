require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Server is running ✅');
});

// Calendly webhook
app.post('/calendly', (req, res) => {
  console.log('CALENDLY DATA:', req.body);
  const event = req.body.event || 'unknown';
  if (event === 'invitee.created') {
    console.log('🔥 New booking received!');
  } else {
    console.log('Other event:', event);
  }
  res.sendStatus(200);
});

// Twilio webhook
app.post('/twilio', async (req, res) => {
  console.log('TWILIO DATA:', req.body);
  const prompt = `New SMS from Twilio: ${JSON.stringify(req.body)}`;

  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',
      {
        phone_number: '+1555XXXXXXX',
        task: prompt,
        model: 'base',
        language: 'en'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLAND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Bland AI response:', response.data);
  } catch (error) {
    console.error('Error calling Bland AI:', error.response ? error.response.data : error.message);
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
