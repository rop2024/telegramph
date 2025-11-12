const axios = require('axios');

const base = 'http://localhost:5000';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  try {
    const email = `copilot_test_${Date.now()}@example.com`;
    const password = 'Password1!';
    const name = 'Copilot Test';

    console.log('Registering user:', email);
    let token;

    try {
      const reg = await axios.post(`${base}/api/auth/register`, { name, email, password });
      console.log('Register response:', reg.data && reg.data.message);
      token = reg.data && reg.data.token;
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message && err.response.data.message.includes('User already exists')) {
        console.log('User already exists, attempting login');
        const login = await axios.post(`${base}/api/auth/login`, { email, password });
        token = login.data && login.data.token;
      } else {
        throw err;
      }
    }

    if (!token) {
      throw new Error('Failed to obtain auth token');
    }

    console.log('Got token. Waiting briefly for server readiness...');
    await sleep(1000);

    const to = email; // send draft to the same temp email
    const subject = 'Draft created via API test';
    const body = '<p>This draft was created by an automated test script.</p>';

    console.log('Creating Gmail draft...');

    const create = await axios.post(
      `${base}/api/mail/create-draft-gmail`,
      { to, subject, body },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    console.log('Create draft response:');
    console.log(JSON.stringify(create.data, null, 2));
  } catch (err) {
    console.error('Test script error:');
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
})();
