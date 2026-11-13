const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { CLIENT_ORIGIN, NODE_ENV } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1); // correct client IPs behind a reverse proxy (needed for rate limiting)
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN.split(','), credentials: false }));
app.use(express.json({ limit: '100kb' }));
if (NODE_ENV !== 'test') app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
