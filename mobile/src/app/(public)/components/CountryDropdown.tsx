import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

type CountryDropdownProps = {
  selected: string
  onSelect: (code: string) => void
}

const COUNTRIES = [
  { code: 'IN', flag: '🇮🇳' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'GB', flag: '🇬🇧' },
  { code: 'CA', flag: '🇨🇦' },
  { code: 'AU', flag: '🇦🇺' },
  { code: 'DE', flag: '🇩🇪' },
  { code: 'FR', flag: '🇫🇷' },
] as const

const getCountryByCode = (code: string) =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0]

const CountryDropdown: React.FC<CountryDropdownProps> = ({
  selected,
  onSelect,
}) => {
  const [open, setOpen] = useState(false)

  const handleSelect = (code: string) => {
    onSelect(code)
    setOpen(false)
  }

  return (
    <View className='relative'>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        className='flex-row items-center rounded-xl bg-[#222228] px-3 py-1'
        hitSlop={10}
      >
        <Text className='mr-1 text-base'>{getCountryByCode(selected).flag}</Text>
        <Text className='text-xs text-white'>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && (
        <View
          className='absolute right-0 top-10 w-24 rounded-2xl bg-[#1B1B1D] border border-[#303030] py-1 z-20'
          style={{ elevation: 8 }}
        >
          {COUNTRIES.map(({ code, flag }) => (
            <Pressable
              key={code}
              onPress={() => handleSelect(code)}
              className='px-3 py-2'
            >
              <Text
                className={`text-xs font-rubik-medium ${
                  code === selected ? 'text-white' : 'text-[#A8A29E]'
                }`}
              >
                {flag}  {code}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

export default CountryDropdown
