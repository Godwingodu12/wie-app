import React from 'react';
import { TouchableOpacity, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

interface ProfileButtonProps {
  label: string;
  iconName?: string; 
  onPress?: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ 
  label, 
  iconName, 
  onPress, 
}) => {
  const { width } = useWindowDimensions();
  
  // Logic for scaling based on device size
  const isTablet = width > 768;
  const isSmallPhone = width < 380;

  // Dynamic values
  const buttonHeight = isTablet ? 80 : 64;
  const iconSize = isTablet ? 24 : 20;
  const fontSize = isTablet ? 14 : isSmallPhone ? 11 : 12;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.8}
      // Removed fixed height class, using style for dynamic height
      className="flex-1 bg-[#1C2024] items-center justify-center rounded-2xl mx-1"
      style={{ height: buttonHeight, paddingVertical: isTablet ? 12 : 8 }}
    >
      {iconName && (
        <View style={{ marginBottom: isTablet ? 6 : 4 }}>
          <Ionicons 
            name={iconName as any} 
            size={iconSize} 
            color="white" 
          />
        </View>
      )}
      <Text 
        numberOfLines={1} // Prevents text from wrapping and breaking the layout
        adjustsFontSizeToFit // Automatically shrinks text slightly if it's too long
        className="text-white font-rubik-medium text-center px-1"
        style={{ fontSize: fontSize }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ProfileButton;
