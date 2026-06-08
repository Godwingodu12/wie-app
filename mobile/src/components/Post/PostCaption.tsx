import React, { useState } from 'react';
import { View, Text } from 'react-native';

type ExpandableCaptionProps = {
  username: string;
  caption: string;
  maxLength?: number;
};

const ExpandableCaption: React.FC<ExpandableCaptionProps> = ({ 
  username, 
  caption, 
  maxLength = 90 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongCaption = caption.length > maxLength;
  const displayedText = (isLongCaption && !isExpanded) 
    ? `${caption.slice(0, maxLength)}` 
    : caption;

  return (
    <View className="px-3 mt-2">
      <Text className="text-white leading-5">
        {/* Username */}
        <Text className="font-medium text-[12px]">
          {username}{" "}
        </Text>

        {/* Caption Text Content */}
        <Text className="font-normal text-[12px] text-neutral-200">
          {displayedText}
        </Text>

        {isLongCaption && (
          <Text 
            onPress={() => setIsExpanded(!isExpanded)}
            className="text-neutral-500 font-medium text-[12px]"
          >
            {isExpanded ? "  less" : "... more"}
          </Text>
        )}
      </Text>
    </View>
  );
};

export default ExpandableCaption;
