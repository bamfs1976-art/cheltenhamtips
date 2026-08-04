// Netlify serverless function — proxy to The Racing API
// Credentials are stored in Netlify environment variables:
//   RACING_API_USERNAME
//   RACING_API_PASSWORD
// Never expose credentials in client-side code.

const RACING_API_BASE = 'https://api.theracingapi.com';

// Endpoints on the FREE plan. Verified against the published OpenAPI spec —
// /v1/racecards/today and /v1/racecards/tomorrow do not exist; the free
// racecard endpoint is /v1/racecards/free with a `day=today|tomorrow` param.
const ALLOWED_ENDPOINTS = [
  '/v1/racecards/free',
  '/v1/results/today/free',
  '/v1/courses/regions',
  '/v1/courses',
];

// Endpoints that exist but need a paid plan. Kept here so the 403 explains
// itself rather than surfacing an opaque upstream error.
const PAID_ENDPOINTS = {
  '/v1/racecards/basic': 'Basic',
  '/v1/racecards/summaries': 'Basic',
  '/v1/results/today': 'Basic',
  '/v1/results': 'Standard',
  '/v1/horses/search': 'Standard',
  '/v1/trainers/search': 'Standard',
  '/v1/jockeys/search': 'Standard',
  '/v1/sires/search': 'Standard',
  '/v1/racecards/pro': 'Pro',
  '/v1/odds/': 'Pro',
};

// The upstream call spends our API quota, so the proxy is same-origin only.
// ALLOWED_ORIGIN can widen this for local development.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://cheltenhamtips.netlify.app';

function corsHeaders(origin) {
  const ok = origin === ALLOWED_ORIGIN || /^http:\/\/localhost(:\d+)?$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function isAllowed(endpoint) {
  return ALLOWED_ENDPOINTS.some((allowed) => endpoint.startsWith(allowed));
}

function paidPlanFor(endpoint) {
  const hit = Object.keys(PAID_ENDPOINTS).find((p) => endpoint.startsWith(p));
  return hit ? PAID_ENDPOINTS[hit] : null;
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
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const CORS_HEADERS = corsHeaders(origin);

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
    const plan = paidPlanFor(endpoint);
    return {
      statusCode: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Endpoint not permitted: ${endpoint}`,
        reason: plan
          ? `${endpoint} requires the ${plan} plan. Add it to ALLOWED_ENDPOINTS once the subscription covers it.`
          : 'Not a known Racing API endpoint on the free plan.',
        allowed: ALLOWED_ENDPOINTS,
      }),
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
