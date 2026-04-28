require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  'Футболки',
  'Лонгсливы',
  'Поло',
  'Рубашки',
  'Худи',
  'Свитшоты',
  'Свитера',
  'Кардиганы',
  'Жакеты',
  'Пиджаки',
  'Куртки',
  'Пуховики',
  'Пальто',
  'Плащи',
  'Ветровки',
  'Джинсы',
  'Брюки',
  'Чиносы',
  'Карго',
  'Шорты',
  'Спортивные штаны',
  'Юбки',
  'Платья',
  'Комбинезоны',
  'Костюмы',
  'Нижнее белье',
  'Носки',
  'Обувь',
  'Кроссовки',
  'Кеды',
  'Ботинки',
  'Лоферы',
  'Сандалии',
  'Тапки',
  'Головные уборы',
  'Кепки',
  'Шапки',
  'Панамы',
  'Шарфы',
  'Перчатки',
  'Сумки',
  'Рюкзаки',
  'Кошельки',
  'Ремни',
  'Украшения',
  'Часы',
  'Очки',
  'Косметика',
  'Парфюм',
  'Аксессуары',
  'Другое',
];

async function main() {
  const before = await prisma.category.count();

  const created = await prisma.category.createMany({
    data: categories.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const after = await prisma.category.count();
  console.log('created:', created.count);
  console.log('before:', before);
  console.log('total:', after);
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
