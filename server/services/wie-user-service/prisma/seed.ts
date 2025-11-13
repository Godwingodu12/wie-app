import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed countries
  const countries = [
    { countryCode: 'IN', countryName: 'India' },
    { countryCode: 'US', countryName: 'United States' },
    { countryCode: 'GB', countryName: 'United Kingdom' },
    { countryCode: 'CA', countryName: 'Canada' },
    { countryCode: 'AU', countryName: 'Australia' },
    { countryCode: 'AE', countryName: 'United Arab Emirates' },
    { countryCode: 'SG', countryName: 'Singapore' },
    { countryCode: 'MY', countryName: 'Malaysia' },
    { countryCode: 'DE', countryName: 'Germany' },
    { countryCode: 'FR', countryName: 'France' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { countryCode: country.countryCode },
      update: {},
      create: country,
    });
  }

  console.log('✅ Seeded countries');
  console.log(`📊 Total countries: ${countries.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
export default prisma;