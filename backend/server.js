require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

for (const key of ['MONGO_URI', 'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET']) {
  if (!process.env[key]) { console.error(`Missing env var: ${key}`); process.exit(1); }
}

const app = express();
app.set('trust proxy', 1); // Vercel/other reverse proxies
app.use(helmet());
const clientUrl = process.env.CLIENT_URL || 'https://e-commerce-admin-ten-ruby.vercel.app';
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/products', require('./src/routes/product.routes'));
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// In production the same server also serves the built React app => one live link
const dist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((e) => { console.error('DB connection failed:', e.message); process.exit(1); });
