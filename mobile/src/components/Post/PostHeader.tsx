import { Image, Text, TouchableOpacity, View, ActivityIndicator, Modal, TouchableWithoutFeedback, StyleSheet, Dimensions } from 'react-native'
import React, { useState, useRef } from 'react'
import Avatar from './Avatar'
import { Ionicons } from '@expo/vector-icons'
import icons from '@/constants/icons'
import { COLORS } from '@/constants/theme'
import { router } from 'expo-router'
import { useFollowSync } from '@/hooks/useFollowSync'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  userId?: string;
  isFollowing?: boolean;
  isSelf?: boolean;
  username: string;
  name?: string;
  isVerified?: boolean;
  timestamp: string;
  musicTitle?: string;
  musicArtist?: string;
  profileImage?: string;
}

const PostHeader: React.FC<Props> = ({ userId, isFollowing: initialIsFollowing = false, isSelf = false, username, name, isVerified = false, timestamp, musicTitle, musicArtist, profileImage }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 10 });
  const menuIconRef = useRef<View>(null);

  const { isFollowing, isRequested, toggleFollow, isLoading } = useFollowSync(
    userId || '',
    initialIsFollowing
  );

  const handleProfilePress = () => {
    if (isSelf) {
      router.push('/(protected)/(tabs)/profile');
    } else if (userId) {
      router.push({
        pathname: '/Profile/OtherProfile',
        params: {
          id: userId,
          username: username,
          avatar: profileImage,
          isFollowing: String(isFollowing),
          type: 'user'
        }
      });
    }
  };

  const displayName = username || name || 'user';
  const audioTitle = musicTitle 
    ? (musicArtist ? `${musicTitle}, ${musicArtist}` : musicTitle)
    : "original audio";

  const toggleMenu = () => {
    if (!isMenuVisible && menuIconRef.current) {
      menuIconRef.current.measure((x, y, width, height, pageX, pageY) => {
        // Position below the icon (pageY + height)
        setMenuPosition({ 
          top: pageY + height + 5, 
          right: SCREEN_WIDTH - (pageX + width) 
        });
        setIsMenuVisible(true);
      });
    } else {
      setIsMenuVisible(false);
    }
  };

  const handleMenuOption = (option: string) => {
    setIsMenuVisible(false);
    if (option === 'unfollow' || option === 'follow') {
      toggleFollow();
    } else if (option === 'visit') {
      handleProfilePress();
    }
    // 'not_interested' logic can be added here
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        
        {/* Left Section: Avatar + Info */}
        <View className='flex-row items-center flex-1'>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={handleProfilePress}
          >
            <Avatar hasStory image={profileImage} />
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }} className='flex-1 justify-center'>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={handleProfilePress}
              className='flex-row items-center'
            >
              <Text
                className='text-[14px] text-white font-bold mr-1'
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isVerified && <Ionicons name="checkmark-circle" size={14} color="white" />}
            </TouchableOpacity>

            <View className='flex-row items-center mt-0.5'>
              <Ionicons name='musical-note' color={COLORS.black_secondary_text} size={11} />
              <Text
                className='text-black_secondary_text text-[11px] font-medium ml-1'
                numberOfLines={1}
              >
                {audioTitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Right Section: Follow Button + Menu */}
        <View className='flex-row items-center'>
          {!isSelf && userId && !isFollowing && (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={toggleFollow}
              disabled={isLoading}
              style={{ backgroundColor: COLORS.secondary }}
              className={`px-5 py-1.5 rounded-full mr-3 min-w-[70px] items-center justify-center`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white text-[13px] font-semibold">
                  {isRequested ? 'Requested' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          <View ref={menuIconRef} collapsable={false}>
            <TouchableOpacity 
              hitSlop={15}
              onPress={toggleMenu}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom Row: Timestamp */}
      <Text style={styles.timestampText}>
        {timestamp}
      </Text>

      {/* Menu Popup */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menuContainer, { top: menuPosition.top, right: menuPosition.right }]}>
              {isFollowing ? (
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleMenuOption('unfollow')}
                >
                  <Text style={styles.menuText}>Unfollow</Text>
                </TouchableOpacity>
              ) : (
                !isSelf && (
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => handleMenuOption('follow')}
                  >
                    <Text style={styles.menuText}>Follow</Text>
                  </TouchableOpacity>
                )
              )}
              
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => handleMenuOption('visit')}
              >
                <Text style={styles.menuText}>Visit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, { borderBottomWidth: 0 }]} 
                onPress={() => handleMenuOption('not_interested')}
              >
                <Text style={styles.menuText}>Not Interested</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    minHeight: 60,
    paddingTop: 8,
    paddingBottom: 6,
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestampText: {
    color: '#A8A29E',
    fontSize: 11,
    fontWeight: 'normal',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 6,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    width: 180,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#3A3A3C',
  },
  menuText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default PostHeader
