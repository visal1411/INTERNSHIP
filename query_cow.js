const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cow = await prisma.cow.findUnique({ where: { id: 3 } });
  console.log('COW DATA:', cow);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
