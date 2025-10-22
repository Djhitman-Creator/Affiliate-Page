// scripts/verify-purchaseurl.js
require('dotenv').config({ path: '.env' }); // load DATABASE_URL/DIRECT_URL
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const row = await prisma.track.findFirst({
      select: { id: true, purchaseUrl: true },
    });
    console.log('OK:', row);
  } catch (e) {
    console.error('ERR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
