// api/telegram-webhook.js
const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Bot de Telegram
const bot = new Telegraf(process.env.BOT_TOKEN);

// Handler principal para Vercel
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ ok: false, error: 'Method not allowed' });
  }

  try {
    await bot.handleUpdate(req.body);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error', err);
    return res.status(500).json({ ok: false });
  }
};

// Handlers del bot
bot.start(async (ctx) => {
  await ctx.reply('Bienvenido a Smokelandia 🔥');

  await supabase.from('bot_events').insert({
    event: 'bot_start',
    tg_user_id: ctx.from.id,
    username: ctx.from.username || null,
    first_name: ctx.from.first_name || null,
  });
});
