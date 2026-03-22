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
  await sheets.spreadsheets.values.
