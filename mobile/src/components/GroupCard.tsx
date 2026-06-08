import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  Image, 
  StyleSheet, 
  Dimensions, 
  View,
  ImageSourcePropType
} from 'react-native';

// Get screen width to calculate card size dynamically
const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // (Screen width - padding) / 2

interface GroupCardProps {
  id: string;
  title: string;
  subtitle: string;
  imageSource: ImageSourcePropType;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const GroupCard = ({ 
  id, 
  title, 
  subtitle, 
  imageSource, 
  isSelected, 
  onPress 
}: GroupCardProps) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(id)}
      activeOpacity={0.9}
      style={[
        styles.card,
        isSelected ? styles.cardSelected : styles.cardUnselected
      ]}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image 
          source={imageSource} 
          style={styles.image} 
          resizeMode="contain" 
        />
      </View>

      {/* Text Content */}
      <Text style={[
        styles.title, 
        isSelected ? styles.textDark : styles.textLight
      ]}>
        {title}
      </Text>

      <Text style={[
        styles.subtitle, 
        isSelected ? styles.textDarkSecondary : styles.textLightSecondary
      ]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3, // 1.3 aspect ratio for tall cards
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    // Shadow properties
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardSelected: {
    backgroundColor: '#FFFFFF',
  },
  cardUnselected: {
    backgroundColor: '#1C1C1E', // Dark card background
  },
  imageContainer: {
    height: '50%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  image: {
    width: 90, 
    height: 90,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  // Dynamic Text Colors
  textDark: { color: '#000000' },
  textLight: { color: '#FFFFFF' },
  textDarkSecondary: { color: '#666666' },
  textLightSecondary: { color: '#AAAAAA' },
});

export default GroupCard;
