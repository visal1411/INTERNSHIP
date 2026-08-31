/**
 * Admin Script to Provision / Register Farmer Accounts
 *
 * Usage:
 *   node scripts/adminCreateFarmer.js --name "John Doe" --phone "012345678" --password "password123" [--email "john@agroscale.com"] [--device "esp32-gateway-01"]
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = val;
    }
  }
  return params;
}

async function run() {
  const args = parseArgs();
  const name = args.name || args.n;
  const phone = args.phone || args.p;
  const password = args.password || args.pass;
  const email = args.email || args.e || null;
  const deviceId = args.device || args.d || null;

  if (!name || !phone || !password) {
    console.error('❌ Error: Missing required arguments.');
    console.log('\nUsage:');
    console.log('  node scripts/adminCreateFarmer.js --name "Farmer Name" --phone "012345678" --password "secret123" [--email "farmer@agroscale.com"] [--device "esp32-gateway-03"]\n');
    process.exit(1);
  }

  console.log(`🔐 Provisioning farmer account: "${name}" (${phone})...`);

  const existingPhone = await prisma.farmer.findUnique({ where: { phone } });
  if (existingPhone) {
    console.error(`❌ Error: A farmer with phone number "${phone}" already exists (ID: ${existingPhone.id}).`);
    process.exit(1);
  }

  if (email) {
    const existingEmail = await prisma.farmer.findUnique({ where: { email } });
    if (existingEmail) {
      console.error(`❌ Error: A farmer with email "${email}" already exists (ID: ${existingEmail.id}).`);
      process.exit(1);
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const farmerData = {
    name,
    phone,
    email: email || undefined,
    passwordHash
  };

  if (deviceId) {
    farmerData.devices = {
      create: [{ deviceId }]
    };
  }

  const newFarmer = await prisma.farmer.create({
    data: farmerData,
    include: {
      devices: true
    }
  });

  console.log('✅ Farmer successfully created by Admin!');
  console.log(`   ID:     ${newFarmer.id}`);
  console.log(`   Name:   ${newFarmer.name}`);
  console.log(`   Phone:  ${newFarmer.phone}`);
  if (newFarmer.email) console.log(`   Email:  ${newFarmer.email}`);
  if (newFarmer.devices.length > 0) {
    console.log(`   Scale:  ${newFarmer.devices.map(d => d.deviceId).join(', ')}`);
  }
}

run()
  .catch((err) => {
    console.error('❌ Failed to create farmer:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
