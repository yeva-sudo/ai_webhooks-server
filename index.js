require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.send('Glam Salon Server is running ✅');
});

// ============================================
// PHASE 1 & 2: SMS + Missed Call → Bland AI
// ============================================
app.post('/twilio', async (req, res) => {
  console.log('TWILIO DATA:', req.body);

  const customerPhone = req.body.From;
  const message = req.body.Body || 'missed call';
  const callStatus = req.body.CallStatus;

  // Detect if it's a missed call or SMS
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
    console.error('❌ Bland AI error:', error.response ? error.response.data : error.message);
  }

  res.sendStatus(200);
});

// ============================================
// PHASE 4: Appointment Reminder
// ============================================
app.post('/reminder', async (req, res) => {
  const { phone, name, date, time } = req.body;

  const task = `You are a receptionist for Glam Salon. Call this customer and say: 
  "Hi ${name}! This is a reminder from Glam Salon that you have an appointment on ${date} at ${time}. 
  Please reply YES to confirm or call us to reschedule. We look forward to seeing you!"`;

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
    console.log('✅ Reminder call queued:', response.data);
    res.json({ success: true, call_id: response.data.call_id });
  } catch (error) {
    console.error('❌ Reminder error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// ============================================
// PHASE 5: Follow-up / Review Call
// ============================================
app.post('/followup', async (req, res) => {
  const { phone, name } = req.body;

  const task = `You are a receptionist for Glam Salon. Call this customer and say: 
  "Hi ${name}! This is Glam Salon. We hope you loved your recent visit! 
  We would really appreciate if you could leave us a Google review. 
  It only takes 2 minutes and helps us so much. Thank you and see you soon!"`;

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
    console.log('✅ Follow-up call queued:', response.data);
    res.json({ success: true, call_id: response.data.call_id });
  } catch (error) {
    console.error('❌ Follow-up error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to send follow-up' });
  }
});

// ============================================
// PHASE 6: Lead Response (website form)
// ============================================
app.post('/lead', async (req, res) => {
  const { phone, name, service } = req.body;

  const task = `You are a receptionist for Glam Salon. Call this lead and say: 
  "Hi ${name}! This is Glam Salon calling. We saw you were interested in ${service || 'our services'}. 
  We'd love to book you in! When would be a good time for your appointment?"`;

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
    res.json({ success: true, call_id: response.data.call_id });
  } catch (error) {
    console.error('❌ Lead error:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to call lead' });
  }
});

// ============================================
// CALENDLY (for when you upgrade)
// ============================================
app.post('/calendly', async (req, res) => {
  console.log('CALENDLY DATA:', req.body);
  const event = req.body.event || 'unknown';

  if (event === 'invitee.created') {
    const name = req.body.payload?.invitee?.name || 'there';
    const phone = req.body.payload?.invitee?.text_reminder_number;
    const time = req.body.payload?.event?.start_time || 'your scheduled time';

    if (phone) {
      const task = `You are a receptionist for Glam Salon. Call and say: 
      "Hi ${name}! This is Glam Salon confirming your appointment at ${time}. 
      We can't wait to see you! If you need to reschedule please call us back."`;

      try {
        await axios.post(
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
        console.log('✅ Calendly confirmation call queued');
      } catch (error) {
        console.error('❌ Calendly call error:', error.message);
      }
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Glam Salon Server running on port ${PORT}`);
});
