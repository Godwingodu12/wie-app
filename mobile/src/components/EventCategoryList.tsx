import React from 'react'
import { FlatList, View } from 'react-native'

import EventCategory from '@/components/EventCategory'
import { EventCategoryItem } from '@/constants/eventCategoryData'

type EventCategoryListProps = {
  data: EventCategoryItem[]
  onCategoryPress?: (item: EventCategoryItem) => void
}

const EventCategoryList = ({
  data,
  onCategoryPress,
}: EventCategoryListProps) => {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="mr-3 mt-4">
          <EventCategory
            image={item.image}
            title={item.title}
            onPress={() => onCategoryPress?.(item)}
          />
        </View>
      )}
    />
  )
}

export default EventCategoryList
