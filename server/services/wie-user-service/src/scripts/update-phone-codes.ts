import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Canonical country list
 * countryCode = ISO-2
 * phoneCode   = dialing prefix
 */
const countriesData: Array<{
  countryCode: string;
  countryName: string;
  phoneCode: string;
}> = [
  { countryCode: 'US', countryName: 'United States', phoneCode: '+1' },
  { countryCode: 'CA', countryName: 'Canada', phoneCode: '+1' },
  { countryCode: 'GB', countryName: 'United Kingdom', phoneCode: '+44' },
  { countryCode: 'AU', countryName: 'Australia', phoneCode: '+61' },
  { countryCode: 'IN', countryName: 'India', phoneCode: '+91' },
  { countryCode: 'DE', countryName: 'Germany', phoneCode: '+49' },
  { countryCode: 'FR', countryName: 'France', phoneCode: '+33' },
  { countryCode: 'IT', countryName: 'Italy', phoneCode: '+39' },
  { countryCode: 'ES', countryName: 'Spain', phoneCode: '+34' },
  { countryCode: 'MX', countryName: 'Mexico', phoneCode: '+52' },
  { countryCode: 'BR', countryName: 'Brazil', phoneCode: '+55' },
  { countryCode: 'AR', countryName: 'Argentina', phoneCode: '+54' },
  { countryCode: 'CL', countryName: 'Chile', phoneCode: '+56' },
  { countryCode: 'CO', countryName: 'Colombia', phoneCode: '+57' },
  { countryCode: 'PE', countryName: 'Peru', phoneCode: '+51' },
  { countryCode: 'JP', countryName: 'Japan', phoneCode: '+81' },
  { countryCode: 'CN', countryName: 'China', phoneCode: '+86' },
  { countryCode: 'KR', countryName: 'South Korea', phoneCode: '+82' },
  { countryCode: 'SG', countryName: 'Singapore', phoneCode: '+65' },
  { countryCode: 'MY', countryName: 'Malaysia', phoneCode: '+60' },
  { countryCode: 'TH', countryName: 'Thailand', phoneCode: '+66' },
  { countryCode: 'ID', countryName: 'Indonesia', phoneCode: '+62' },
  { countryCode: 'PH', countryName: 'Philippines', phoneCode: '+63' },
  { countryCode: 'VN', countryName: 'Vietnam', phoneCode: '+84' },
  { countryCode: 'NZ', countryName: 'New Zealand', phoneCode: '+64' },
  { countryCode: 'AE', countryName: 'United Arab Emirates', phoneCode: '+971' },
  { countryCode: 'SA', countryName: 'Saudi Arabia', phoneCode: '+966' },
  { countryCode: 'TR', countryName: 'Turkey', phoneCode: '+90' },
  { countryCode: 'PK', countryName: 'Pakistan', phoneCode: '+92' },
  { countryCode: 'BD', countryName: 'Bangladesh', phoneCode: '+880' },
  { countryCode: 'LK', countryName: 'Sri Lanka', phoneCode: '+94' },
  { countryCode: 'NP', countryName: 'Nepal', phoneCode: '+977' },
];

async function syncCountries() {
  console.log('🌍 Syncing countries & phone codes...\n');

  let created = 0;
  let updated = 0;

  for (const country of countriesData) {
    const exists = await prisma.country.findUnique({
      where: { countryCode: country.countryCode },
    });

    if (exists) {
      await prisma.country.update({
        where: { countryCode: country.countryCode },
        data: {
          countryName: country.countryName,
          phoneCode: country.phoneCode,
        },
      });
      console.log(`🔁 Updated: ${country.countryName} (${country.countryCode})`);
      updated++;
    } else {
      await prisma.country.create({
        data: {
          countryCode: country.countryCode,
          countryName: country.countryName,
          phoneCode: country.phoneCode,
        },
      });
      console.log(`✅ Created: ${country.countryName} (${country.countryCode})`);
      created++;
    }
  }

  console.log('\n📊 SUMMARY');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Total:   ${countriesData.length}`);
}

syncCountries()
  .catch((err) => {
    console.error('❌ Sync failed:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });