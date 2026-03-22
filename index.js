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
app.post('/twilio', (req, res) => {
  console.log('TWILIO DATA:', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
