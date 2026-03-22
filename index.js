require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Root route
app.get('/', (req, res) => res.send('Server is running ✅'));

// Twilio webhook endpoint
app.post('/twilio', (req, res) => {
  console.log('Twilio webhook received:', req.body);
  res.status(200).send('Twilio webhook received');
});

// Calendly webhook endpoint
app.post('/calendly', (req, res) => {
  console.log('Calendly webhook received:', req.body);
  res.status(200).send('Calendly webhook received');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
