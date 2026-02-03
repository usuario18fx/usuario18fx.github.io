require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const trackHandler = require('./api/track');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/track', (req, res) => trackHandler(req, res));
// Landing
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Login Telegram
app.get("/login", (req, res) => {
  const botUsername = process.env.BOT_USERNAME;
  const baseUrl = process.env.BASE_URL;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login</title>
</head>
<body>
  <h2>Login con Telegram</h2>
  <script async src="https://telegram.org/js/telegram-widget.js?22"
    data-telegram-login="${botUsername}"
    data-size="large"
    data-auth-url="${baseUrl}/auth/telegram">
  </script>
</body>
</html>
  `);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Running on http://localhost:${port}`));
