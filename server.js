require('dotenv').config();

const app = require('./src/app');
const { seedDefaultUser } = require('./src/utils/seed');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const BASE_PATH = process.env.BASE_PATH || '';

(async () => {
  try {
    await seedDefaultUser();
  } catch (err) {
    console.error('[SmartPay] Seed failed (continuing):', err.message);
  }

  app.listen(PORT, () => {
    console.log(`[SmartPay] running on http://localhost:${PORT}${BASE_PATH}`);
  });
})();
