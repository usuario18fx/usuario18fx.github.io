// api/track.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // usa la misma que ya tenías
);

async function trackHandler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ ok: false, error: 'Method not allowed' });
  }

  const ipHeader = req.headers['x-forwarded-for'] || '';
  const ip = ipHeader.toString().split(',')[0].trim() || 'unknown';

  const { event, extra } = req.body || {};
  const source = extra?.source ?? null;

  const { error } = await supabase.from('landing_clicks').insert({
    event,
    source,
    ip,
    user_agent: req.headers['user-agent'] || null,
  });

  if (error) {
    console.error(error);
    return res.status(500).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
}

module.exports = trackHandler;
