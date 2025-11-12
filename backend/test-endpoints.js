// Test script to exercise key backend endpoints and report results
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const emailService = require('./utils/emailService');

const PORT = process.env.PORT || 5000;
const BASE = process.env.SERVER_URL || `http://localhost:${PORT}`;

const endpoints = [
  { method: 'get', path: '/api/health', desc: 'Health check (public)' },
  { method: 'get', path: '/api/db-status', desc: 'DB status (public)' },
  { method: 'get', path: '/api/auth/google/url', desc: 'Google OAuth URL (public)' },
  { method: 'get', path: '/api/mail/status', desc: 'Mail service status (protected)' },
  { method: 'post', path: '/api/mail/send-test', desc: 'Send test email (protected)', data: { to: 'example+test@invalid.invalid', subject: 'Test', body: '<p>Test body</p>' } },
  { method: 'get', path: '/api/mail/track/test-pixel/pixel.gif', desc: 'Tracking pixel (public)' }
];

async function callEndpoint(e) {
  const url = `${BASE}${e.path}`;
  const res = { path: e.path, desc: e.desc };

  try {
    if (e.method === 'get') {
      const r = await axios.get(url, { timeout: 10000 });
      res.status = r.status;
      res.ok = r.status >= 200 && r.status < 300;
      // Try to summarize body: if image or buffer, note content-type
      res.headers = r.headers && r.headers['content-type'] ? { 'content-type': r.headers['content-type'] } : {};
      if (r.headers && r.headers['content-type'] && r.headers['content-type'].includes('image')) {
        res.body = '<binary image>';
      } else {
        // only include small bodies
        const bodyStr = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
        res.body = bodyStr.length > 1000 ? bodyStr.slice(0, 1000) + '... (truncated)' : bodyStr;
      }
    } else if (e.method === 'post') {
      const r = await axios.post(url, e.data, { timeout: 10000 });
      res.status = r.status;
      res.ok = r.status >= 200 && r.status < 300;
      res.body = JSON.stringify(r.data).slice(0, 2000);
    }
  } catch (err) {
    if (err.response) {
      res.status = err.response.status;
      res.ok = false;
      res.body = err.response.data && typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : String(err.response.data);
    } else {
      res.status = null;
      res.ok = false;
      res.body = err.message;
    }
  }

  return res;
}

async function run() {
  console.log('Starting backend by requiring server (this will listen on configured PORT)');
  try {
    // require server to start the app in this process
    require('./server');
  } catch (err) {
    console.error('Failed to require server:', err && err.message ? err.message : err);
    // continue to run tests anyway (server might already be running externally)
  }

  // Give server a moment to start
  await new Promise(r => setTimeout(r, 1200));

  const results = [];

  // Include emailService status
  try {
    results.push({ path: 'emailService.getStatus()', desc: 'Local email service status', ok: true, body: emailService.getStatus() });
  } catch (err) {
    results.push({ path: 'emailService.getStatus()', desc: 'Local email service status', ok: false, body: String(err) });
  }

  for (const e of endpoints) {
    console.log(`Calling ${e.method.toUpperCase()} ${e.path} ...`);
    const r = await callEndpoint(e);
    results.push(r);
    if (!r.ok) {
      console.warn(` -> ${e.path} returned error (status=${r.status})`);
    } else {
      console.log(` -> ${e.path} OK (status=${r.status})`);
    }
  }

  // Write report
  const reportPath = './test-endpoints-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({ timestamp: new Date().toISOString(), base: BASE, results }, null, 2));
  console.log('\nTest report written to', reportPath);

  // Print summary
  const failures = results.filter(r => !r.ok);
  console.log(`\nSummary: ${results.length - failures.length} OK, ${failures.length} FAILED`);
  if (failures.length > 0) {
    console.log('Failures:');
    failures.forEach(f => console.log(` - ${f.path}: status=${f.status} body=${typeof f.body==='string'?f.body.slice(0,200):JSON.stringify(f.body).slice(0,200)}`));
  }

  // Exit the process so the script ends (server will be closed)
  process.exit(failures.length === 0 ? 0 : 2);
}

run();
