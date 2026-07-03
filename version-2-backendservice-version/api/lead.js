const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';
const ADMIN_TEMPLATE_ID = 'template_zbikicg';
const CUSTOMER_TEMPLATE_ID = 'template_6f1oa0t';
const MAX_PAYLOAD_BYTES = 12000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map();

const REQUIRED_FIELDS = [
  'sterbegeld_empfaenger',
  'sterbegeld_summe',
  'vorname',
  'name',
  'telefonnummer',
  'strasse_hausnummer',
  'postleitzahl',
  'ort',
  'geburtsdatum',
  'email',
  'to_email',
  'to_name',
  'consent_accepted',
  'consent_timestamp'
];

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!isAllowedOrigin(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!String(req.headers['content-type'] || '').includes('application/json')) {
      return res.status(415).json({ error: 'Unsupported media type' });
    }

    if (JSON.stringify(req.body || {}).length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const params = req.body || {};

    if (String(params.website || '').trim()) {
      return res.status(200).json({ success: true });
    }

    const missingField = REQUIRED_FIELDS.find(function (field) {
      return !String(params[field] || '').trim();
    });

    if (missingField) {
      return res.status(400).json({ error: 'Missing required field' });
    }

    if (!isValidEmail(params.email) || !isValidEmail(params.to_email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!isValidLead(params)) {
      return res.status(400).json({ error: 'Invalid submission' });
    }

    await sendEmailJs(ADMIN_TEMPLATE_ID, params);
    await sendEmailJs(CUSTOMER_TEMPLATE_ID, params);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Lead submission failed:', error);
    return res.status(500).json({ error: 'Submission failed' });
  }
}

function setCorsHeaders(req, res) {
  const configuredOrigins = getAllowedOrigins();
  const origin = String(req.headers.origin || '').trim();

  if (configuredOrigins.length === 0 || configuredOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isAllowedOrigin(req) {
  const configuredOrigins = getAllowedOrigins();

  if (configuredOrigins.length === 0) {
    return true;
  }

  const origin = String(req.headers.origin || '').trim();
  return configuredOrigins.includes(origin);
}

function getAllowedOrigins() {
  return String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(function (origin) {
      return origin.trim();
    })
    .filter(Boolean);
}

function getClientIp(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '');
  return forwardedFor.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
}

function isRateLimited(clientIp) {
  const now = Date.now();
  const current = rateLimitStore.get(clientIp);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function isValidLead(params) {
  const phoneDigits = String(params.telefonnummer || '').replace(/\D/g, '');

  return (
    String(params.vorname).length <= 80 &&
    String(params.name).length <= 80 &&
    String(params.strasse_hausnummer).length <= 140 &&
    /^\d{5}$/.test(String(params.postleitzahl || '').trim()) &&
    String(params.ort).length <= 100 &&
    phoneDigits.length >= 6 &&
    phoneDigits.length <= 20 &&
    /^\d{2}\.\d{2}\.\d{4}$/.test(String(params.geburtsdatum || '').trim()) &&
    params.email === params.to_email &&
    params.consent_accepted === 'ja'
  );
}

async function sendEmailJs(templateId, params) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey) {
    throw new Error('Missing EmailJS environment variables');
  }

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: params
  };

  if (privateKey) {
    payload.accessToken = privateKey;
  }

  const response = await fetch(EMAILJS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`EmailJS failed with ${response.status}: ${responseText}`);
  }
}
