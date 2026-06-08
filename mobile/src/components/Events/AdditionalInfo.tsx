import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EVENT_DATA } from '@/constants/eventDetails'; // Import your data source

// 1. Reusable Section Header Wrapper
export const SectionWrapper = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <View className="mt-6">
    <Text className="text-white font-rubik-bold text-lg mb-4">{title}</Text>
    {children}
  </View>
);

// 2. Point of Contact Card (Calculates initials automatically)
export const ContactCard = ({ name, email, phone }: { name: string, email: string, phone: string }) => {
  // Logic to get initials (e.g., "Emma Raducanu" -> "ER")
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View className="flex-row items-center mb-4">
      <View className="w-14 h-14 bg-[#2563EB] rounded-2xl items-center justify-center mr-4">
        <Text className="text-white font-rubik-bold text-lg">{initials}</Text>
      </View>
      <View>
        <Text className="text-white font-rubik-bold text-base">{name}</Text>
        <Text className="text-gray-400 font-rubik-regular text-sm">{email}</Text>
        <Text className="text-gray-400 font-rubik-regular text-sm">{phone}</Text>
      </View>
    </View>
  );
};

// 3. Red Prohibited Tag
export const ProhibitedTag = ({ label }: { label: string }) => (
  <View className="bg-[#7F1D1D]/30 border border-[#7F1D1D]/50 px-4 py-2 rounded-xl mr-2 mb-2">
    <Text className="text-[#F87171] font-rubik-medium text-xs">{label}</Text>
  </View>
);

// 4. Info Icon Row
export const FeatureRow = ({ icon, text, isLink }: { icon: string, text: string, isLink?: boolean }) => (
  <View className="flex-row items-center mb-4">
    <View className="w-12 h-12 bg-[#1C1C1E] rounded-xl items-center justify-center mr-4">
      <Ionicons name={icon as any} size={20} color="white" />
    </View>
    <Text 
      numberOfLines={1} 
      className={`flex-1 font-rubik-medium text-base ${isLink ? 'text-[#3B82F6]' : 'text-gray-300'}`}
    >
      {text}
    </Text>
  </View>
);

// 5. Main Content Component mapping data from EVENT_DATA
const AdditionalInfoContent = () => {
  const data = EVENT_DATA.additionalInfo;

  return (
    <View className="mt-2 pb-10">
      {/* Dynamic Contacts */}
      <SectionWrapper title="Point of Contact">
        {data.contacts.map((contact) => (
          <ContactCard 
            key={contact.id}
            name={contact.name} 
            email={contact.email} 
            phone={contact.phone} 
          />
        ))}
      </SectionWrapper>

      {/* Dynamic Prohibited Items */}
      <SectionWrapper title="Prohibited items">
        <View className="flex-row flex-wrap">
          {data.prohibitedItems.map((item, i) => (
            <ProhibitedTag key={i} label={item} />
          ))}
        </View>
      </SectionWrapper>

      {/* Dynamic More Information / Socials */}
      <SectionWrapper title="More Information">
        {data.moreInfo.map((item, i) => (
          <FeatureRow 
            key={i}
            icon={item.icon} 
            text={item.text} 
            isLink={item.isLink} 
          />
        ))}
      </SectionWrapper>
    </View>
  );
};

export default AdditionalInfoContent;
