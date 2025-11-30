import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();
const toDatabaseFormat = (country) => {
    return {
        id: country.id,
        country_code: country.countryCode,
        country_name: country.countryName,
        created_at: country.createdAt,
    };
};
class CountryModel {
    async findAll() {
        const countries = await prisma.country.findMany({
            orderBy: { countryName: 'asc' },
        });
        return countries.map(toDatabaseFormat);
    }
    async findById(id) {
        const country = await prisma.country.findUnique({
            where: { id },
        });
        return country ? toDatabaseFormat(country) : null;
    }
    async findByCode(countryCode) {
        const country = await prisma.country.findUnique({
            where: { countryCode },
        });
        return country ? toDatabaseFormat(country) : null;
    }
    async disconnect() {
        await prisma.$disconnect();
    }
}
export default new CountryModel();
//# sourceMappingURL=country.model.js.map