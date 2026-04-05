// Netlify serverless function — proxy to The Racing API
// Credentials are stored in Netlify environment variables:
//   RACING_API_USERNAME
//   RACING_API_PASSWORD
// Never expose credentials in client-side code.

const RACING_API_BASE = 'https://api.theracingapi.com';

const ALLOWED_ENDPOINTS = [
  '/v1/racecards/free',
  '/v1/racecards/today',
  '/v1/racecards/tomorrow',
  '/v1/results/today',
  '/v1/results/',
  '/v1/courses',
  '/v1/horses/search',
  '/v1/trainers/search',
  '/v1/jockeys/search',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function isAllowed(endpoint) {
  return ALLOWED_ENDPOINTS.some((allowed) => endpoint.startsWith(allowed));
}

function buildUpstreamUrl(endpoint, queryParams) {
  const url = new URL(RACING_API_BASE + endpoint);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (k !== 'endpoint') url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

exports.handler = async function (event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Check credentials are configured
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;

  if (!username || !password) {
    return {
      statusCode: 503,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Racing API credentials not configured.' }),
    };
  }

  // Validate endpoint param
  const { endpoint, ...rest } = event.queryStringParameters || {};

  if (!endpoint) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required parameter: endpoint.' }),
    };
  }

  // Whitelist check
  if (!isAllowed(endpoint)) {
    return {
      statusCode: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Endpoint not permitted: ${endpoint}` }),
    };
  }

  // Build upstream request
  const upstreamUrl = buildUpstreamUrl(endpoint, rest);
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  let upstreamRes;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Upstream fetch failed.', detail: err.message }),
    };
  }

  const contentType = upstreamRes.headers.get('content-type') || 'application/json';
  const body = await upstreamRes.text();

  return {
    statusCode: upstreamRes.status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=180', // 3-minute cache, matches API update cadence
    },
    body,
  };
};
