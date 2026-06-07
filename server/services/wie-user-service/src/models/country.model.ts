import prisma from '../lib/prisma';

export interface Country {
  id: string;
  country_code: string;
  country_name: string;
  phone_code: string | null;
  created_at: Date;
}

const toDatabaseFormat = (country: any): Country => {
  return {
    id: country.id,
    country_code: country.countryCode,
    country_name: country.countryName,
    phone_code: country.phoneCode || null,  
    created_at: country.createdAt,
  };
};
class CountryModel {
  async findAll(): Promise<Country[]> {
    const countries = await prisma.country.findMany({
      orderBy: { countryName: 'asc' },
    });
    return countries.map(toDatabaseFormat);
  }

  async findById(id: string): Promise<Country | null> {
    const country = await prisma.country.findUnique({
      where: { id },
    });
    return country ? toDatabaseFormat(country) : null;
  }

  async findByCode(countryCode: string): Promise<Country | null> {
    const country = await prisma.country.findUnique({
      where: { countryCode },
    });
    return country ? toDatabaseFormat(country) : null;
  }
}
export default new CountryModel();
