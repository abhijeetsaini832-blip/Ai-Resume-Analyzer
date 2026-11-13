const { PORT } = require('./config/env');
const connectDB = require('./config/db');
const { seedCompanies } = require('./seed/companies');
const app = require('./app');

// Safety net: a stray promise rejection from a library must never take the whole API down.
process.on('unhandledRejection', (reason) => console.error('Unhandled promise rejection (server kept running):', reason));

(async () => {
  await connectDB();
  await seedCompanies();
  const server = app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));

  const shutdown = (sig) => {
    console.log(`${sig} received, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
