require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

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

  const prompt = `Incoming SMS: ${JSON.stringify(req.body)}`;

  try {
    const response = await axios.post(
      'https://api.bland.ai/v1/calls',  // Correct endpoint
      {
        phone_number: '+1555XXXXXXX',    // Your real number
        task: prompt,                    // Message AI should perform
        model: 'base',                   // AI model
        language: 'en'                   // Language
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BLAND_API_KEY}`, // Your API key
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Bland AI response:', response.data); // Logs response
  } catch (error) {
    console.error('Error calling Bland AI:', error.response ? error.response.data : error.message);
  }

  res.sendStatus(200);
});






  // Step 1: Prepare message for AI
  const prompt = `New SMS from Twilio: ${JSON.stringify(req.body)}`;

  // Step 2: Send to Bland AI
  try {
    const aiResponse = await axios.post('https://api.bland.ai/respond', { prompt });
    console.log('Bland AI response:', aiResponse.data);
  } catch (error) {
    console.error('Error calling Bland AI:', error.message);
  }

  res.sendStatus(200);
});
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


