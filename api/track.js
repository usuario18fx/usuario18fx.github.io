// api/track.js
const { createClient } = require('@supabase/supabase-js');

// En Vercel no hace falta dotenv, pero en local sí ayuda.
// Si no existe .env, no pasa nada.
try {
  require('dotenv').config();
} catch (_) {}

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  '';

const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Lee JSON aunque el body venga vacío (ej: sendBeacon)
function readJsonBody(req) {
  return new Promise((resolve) => {
    // Si algún runtime ya lo parseó:
    if (req.body && typeof req.body === 'object') return resolve(req.body);

    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = async function trackHandler(req, res) {
  if (req.method !== 'POST') {
    // No exponemos info: simple
    return res.status(405).end();
  }

  // Parse robusto
  const body = await readJsonBody(req);
  const event = typeof body?.event === 'string' ? body.event : null;
  const extra = body?.extra && typeof body.extra === 'object' ? body.extra : {};
  const source = typeof extra?.source === 'string' ? extra.source : null;

  // IP (mejor esfuerzo)
  const xff = req.headers['x-forwarded-for'] || '';
  const ip = xff.toString().split(',')[0].trim() || null;

  // Geo por IP (Vercel headers). Si no existen, queda null.
  const country = req.headers['x-vercel-ip-country'] || null;
  const region = req.headers['x-vercel-ip-country-region'] || null;
  const city = req.headers['x-vercel-ip-city'] || null;
  const timezone = req.headers['x-vercel-ip-timezone'] || null;

  const userAgent = req.headers['user-agent'] || null;

  // Si no tienes env vars, NO rompemos nada: solo log y 204.
  if (!supabase) {
    console.warn('[track] Missing SUPABASE env vars');
    return res.status(204).end();
  }

  // Insert “fail-open”: aunque Supabase falle, respondemos 204 para no bloquear clicks.
  try {
    const { error } = await supabase.from('landing_clicks').insert({
      event,
      source,
      ip,
      user_agent: userAgent,
      country,
      region,
      city,
      timezone,
      path: typeof extra?.path === 'string' ? extra.path : null,
      referrer: typeof extra?.referrer === 'string' ? extra.referrer : null,
    });

    if (error) console.error('[track] supabase insert error:', error);
  } catch (e) {
    console.error('[track] unexpected error:', e);
  }

  // Respuesta rápida (ideal para sendBeacon / fetch keepalive)
  return res.status(204).end();
};
