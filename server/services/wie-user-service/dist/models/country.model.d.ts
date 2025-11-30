export interface Country {
    id: string;
    country_code: string;
    country_name: string;
    created_at: Date;
}
declare class CountryModel {
    findAll(): Promise<Country[]>;
    findById(id: string): Promise<Country | null>;
    findByCode(countryCode: string): Promise<Country | null>;
    disconnect(): Promise<void>;
}
declare const _default: CountryModel;
export default _default;
//# sourceMappingURL=country.model.d.ts.map