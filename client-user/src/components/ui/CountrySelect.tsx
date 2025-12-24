import React from 'react';
import { Country } from '@/types';

interface CountrySelectProps {
  countries: Country[];
  value: string;
  onChange: (countryCode: string) => void;
  required?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  countries,
  value,
  onChange,
  required = false,
}) => {
  const getCountryFlag = (code: string) =>
    code?.length === 2
      ? String.fromCodePoint(
          ...code
            .toUpperCase()
            .split('')
            .map(c => 127397 + c.charCodeAt(0))
        )
      : '🌐';

  const selectedCountry = countries.find(
    c => c.country_code === value
  );

  return (
    <div className="relative flex items-center justify-center gap-1">
      {/* Display: Flag + Phone Code */}
      <div className="flex items-center gap-1 pointer-events-none select-none">
        <span className="text-xl">
          {selectedCountry
            ? getCountryFlag(selectedCountry.country_code)
            : '🌐'}
        </span>
        
        {selectedCountry?.phone_code && (
          <span className="text-xs text-white/60 whitespace-nowrap">
            {selectedCountry.phone_code}
          </span>
        )}
      </div>

      {/* Native select (invisible overlay) */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
        style={{ minWidth: '70px' }}
      >
        {!value && (
          <option value="">Select</option>
        )}

        {countries.map(country => (
          <option
            key={country.country_code}
            value={country.country_code}
          >
            {getCountryFlag(country.country_code)} {country.phone_code || 'N/A'} - {country.country_name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CountrySelect;