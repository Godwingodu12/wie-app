import React from 'react';
import { Country } from '@/types';

interface CountrySelectProps {
  countries: Country[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  countries,
  value,
  onChange,
  required = false,
}) => {
  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Country {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          name="country_id"
          value={value}
          onChange={onChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
          required={required}
          style={{ paddingLeft: '2.5rem' }}
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {getCountryFlag(country.country_code)} {country.country_name}
            </option>
          ))}
        </select>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-xl">
          {value ? (
            countries.find(c => c.id === value) ? 
            getCountryFlag(countries.find(c => c.id === value)!.country_code) : 
            '🌐'
          ) : (
            '🌐'
          )}
        </div>
      </div>
    </div>
  );
};
export default CountrySelect;