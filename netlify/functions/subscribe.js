// Netlify serverless function — email capture stub for the
// "Saturday NAP in your inbox" signup (§9).
//
// TODO: wire to the real email provider before launch. Options:
//   - Mailchimp:  POST https://<dc>.api.mailchimp.com/3.0/lists/{id}/members
//   - Buttondown: POST https://api.buttondown.email/v1/subscribers
//   - ConvertKit: POST https://api.convertkit.com/v3/forms/{id}/subscribe
// Store the provider key in a Netlify environment variable
// (e.g. NEWSLETTER_API_KEY / NEWSLETTER_LIST_ID) — never in client code.
//
// For now this validates the payload and returns 200 so the UI flow
// can be built and demoed end-to-end.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let email = '';
  let list = 'saturday-nap';
  try {
    const data = JSON.parse(event.body || '{}');
    email = (data.email || '').trim();
    if (data.list) list = String(data.list);
  } catch (_) {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  if (!EMAIL_RE.test(email)) {
    return { statusCode: 422, headers, body: JSON.stringify({ ok: false, error: 'Invalid email' }) };
  }

  // TODO: forward `email`/`list` to the real newsletter provider here.
  // Until then, accept and acknowledge so the signup flow works.
  console.log(`[subscribe] stub accepted: ${email} (list: ${list})`);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true, message: 'Subscribed (stub — provider not yet wired).', list }),
  };
};
