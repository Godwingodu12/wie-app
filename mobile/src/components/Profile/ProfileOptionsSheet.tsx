import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  onRestrict?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  onAboutAccount?: () => void;
  onHideStory?: () => void;
  onCopyProfileURL?: () => void;
  onShareProfile?: () => void;
  onQRCode?: () => void;
}

const ProfileOptionsSheet: React.FC<ProfileOptionsSheetProps> = ({
  visible,
  onClose,
  username,
  onRestrict,
  onBlock,
  onReport,
  onAboutAccount,
  onHideStory,
  onCopyProfileURL,
  onShareProfile,
  onQRCode,
}) => {
  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    onClose();
  };


  const optionItemClass = "py-4";
  const redTextClass = "text-[#FF3B30] text-base font-normal";
  const whiteTextClass = "text-white text-base font-normal";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-[#1C1C1E] rounded-t-[20px] pt-3 pb-10 max-h-[80%]"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="w-10 h-1 bg-white/30 rounded-full self-center mb-4" />
          <TouchableOpacity
            className="absolute top-4 right-4 w-8 h-8 items-center justify-center z-10"
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold text-center mb-5 px-4">
            More
          </Text>
          <View className="px-4">
            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onRestrict)}
            >
              <Text className={redTextClass}>Restrict</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onBlock)}
            >
              <Text className={redTextClass}>Block</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onReport)}
            >
              <Text className={redTextClass}>Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onAboutAccount)}
            >
              <Text className={whiteTextClass}>About this account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onHideStory)}
            >
              <Text className={whiteTextClass}>Hide your flux</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onCopyProfileURL)}
            >
              <Text className={whiteTextClass}>Copy profile URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onShareProfile)}
            >
              <Text className={whiteTextClass}>Share this profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={optionItemClass}
              onPress={() => handleAction(onQRCode)}
            >
              <Text className={whiteTextClass}>QR code</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ProfileOptionsSheet;
