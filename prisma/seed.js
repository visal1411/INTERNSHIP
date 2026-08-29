const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  const farmer1 = await prisma.farmer.upsert({
    where: { email: 'farmer1@agroscale.com' },
    update: {},
    create: {
      email: 'farmer1@agroscale.com',
      passwordHash,
      name: 'John Doe',
      devices: {
        create: [
          { deviceId: 'esp32-gateway-01' }
        ]
      }
    }
  });

  const farmer2 = await prisma.farmer.upsert({
    where: { email: 'farmer2@agroscale.com' },
    update: {},
    create: {
      email: 'farmer2@agroscale.com',
      passwordHash,
      name: 'Jane Smith',
      devices: {
        create: [
          { deviceId: 'esp32-gateway-02' }
        ]
      }
    }
  });

  console.log(`✅ Seed successful!`);
  console.log(`- Farmer 1: ${farmer1.email} (Device: esp32-gateway-01)`);
  console.log(`- Farmer 2: ${farmer2.email} (Device: esp32-gateway-02)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
