require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categoriesToRemove = [
  'Спорт',
  'Для дома',
  'Техника',
  'Игры',
  'Коллекционное',
];

async function main() {
  const deleted = await prisma.category.deleteMany({
    where: {
      name: {
        in: categoriesToRemove,
      },
    },
  });

  console.log('deleted:', deleted.count);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
