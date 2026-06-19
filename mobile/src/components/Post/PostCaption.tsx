import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ExpandableCaptionProps = {
  userId?: string;
  username: string;
  caption: string;
  maxLength?: number;
  isVerified?: boolean;
  onCommentPress?: () => void;
  commentCount?: number;
};

const ExpandableCaption: React.FC<ExpandableCaptionProps> = ({ 
  userId,
  username, 
  caption, 
  isVerified = false,
  onCommentPress,
  commentCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);

  const handleProfilePress = () => {
    if (userId) {
      router.push({
        pathname: '/Profile/OtherProfile',
        params: { id: userId, username: username }
      });
    }
  };

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const onHiddenTextLayout = useCallback((e: any) => {
    const lineCount = e.nativeEvent.lines.length;
    // We want to truncate if it exceeds 2 lines
    if (lineCount > 2) {
      setHasOverflow(true);
    }
    setIsMeasured(true);
  }, []);

  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const parts = text.split(/([@#][a-z0-9._]+)/gi);
    return parts.map((part, index) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <Text 
            key={index} 
            style={styles.linkText}
            onPress={() => console.log('Link:', part)}
          >
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  // In preview mode, we collapse newlines to ensure the 2-line limit is used efficiently
  const processedCaption = useMemo(() => {
    if (isExpanded) return caption;
    return caption.replace(/\n\s*\n/g, '\n').replace(/\n/g, ' ');
  }, [caption, isExpanded]);

  return (
    <View style={styles.container}>
      {/* Hidden measurement block */}
      {!isMeasured && (
        <View style={styles.hiddenContainer} pointerEvents="none">
          <Text style={styles.baseText} onTextLayout={onHiddenTextLayout}>
            <Text style={styles.boldText}>{username} </Text>
            {caption}
          </Text>
        </View>
      )}

      <View style={styles.textWrapper}>
        <Text 
          style={styles.baseText}
          numberOfLines={isExpanded ? undefined : 2}
          ellipsizeMode="tail"
        >
          {/* All elements inside one Text block to ensure they stay inline */}
          <Text style={styles.boldText} onPress={handleProfilePress}>
            {username}
            {isVerified && (
              <Text>
                {' '}<Ionicons name="checkmark-circle" size={12} color="#3897f0" />
              </Text>
            )}
            {" "}
          </Text>
          
          <Text style={styles.captionText}>
            {renderTextWithLinks(processedCaption)}
          </Text>
        </Text>

        {!isExpanded && (hasOverflow || caption.length > 80) && (
          <TouchableOpacity 
            onPress={toggleExpand}
            style={styles.moreButton}
            activeOpacity={1}
          >
            <Text style={styles.greyText}>... more</Text>
          </TouchableOpacity>
        )}

        {isExpanded && (
          <TouchableOpacity onPress={toggleExpand} style={styles.lessButton}>
            <Text style={styles.greyText}>less</Text>
          </TouchableOpacity>
        )}
      </View>

      {commentCount > 0 && (
        <TouchableOpacity 
          onPress={onCommentPress}
          className="mt-1"
          activeOpacity={0.7}
        >
          <Text style={styles.greyText}>
            View all {commentCount} comments
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    marginTop: 4,
    width: '100%',
  },
  hiddenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH - 24, // Estimate based on feed padding
    opacity: 0,
    zIndex: -1,
  },
  textWrapper: {
    width: '100%',
    position: 'relative',
  },
  baseText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  captionText: {
    fontWeight: 'normal',
    color: '#F5F5F5',
  },
  linkText: {
    color: '#60A5FA', // blue-400
  },
  greyText: {
    color: '#A3A3A3', // neutral-400
    fontSize: 13,
  },
  moreButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000000', // Match black background
    paddingLeft: 4,
    height: 18,
    justifyContent: 'center',
  },
  lessButton: {
    marginTop: 2,
  }
});

export default ExpandableCaption;
