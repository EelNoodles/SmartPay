require('dotenv').config();

const app = require('./src/app');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const BASE_PATH = process.env.BASE_PATH || '';

app.listen(PORT, () => {
  console.log(`[SmartPay] running on http://localhost:${PORT}${BASE_PATH}`);
});
