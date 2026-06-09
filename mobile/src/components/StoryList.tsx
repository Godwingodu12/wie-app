import React from 'react'
import { FlatList, View } from 'react-native'
import StoryAvatar from '@/components/OurStoryAvatar'
import { useUser } from '@/context/UserContext' 

type StoryItem = {
  id: string
  image?: any
  username: string
  hasStory: boolean
  isSeen: boolean
}

type StoryListProps = {
  stories: StoryItem[]
  onMyStoryPress?: () => void
  onAddStoryPress?: () => void
  onStoryPress?: (story: StoryItem) => void
}

const StoryList = ({
  stories = [],
  onMyStoryPress,
  onAddStoryPress,
  onStoryPress,
}: StoryListProps) => {
  const { user } = useUser();

  const filteredStories = (stories || []).filter((story) => {
    if (story.id === 'me') return true
    return story.hasStory
  })

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      bounces={false}
      data={filteredStories}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isMyStory = item.id === 'me'

        return (
          <View className="mr-3">
            <StoryAvatar
              image={isMyStory ? user.profile_picture : item.image}
              username={isMyStory ? 'Your flux' : item.username}
              hasStory={item.hasStory}
              isSeen={item.isSeen}
              showAddButton={isMyStory}
              onAddPress={isMyStory ? onAddStoryPress : undefined}
              onPress={() =>
                isMyStory
                  ? onMyStoryPress?.()
                  : onStoryPress?.(item)
              }
            />
          </View>
        )
      }}
    />
  )
}

export default StoryList
