import images from '@/constants/images'

export type EventCategoryItem = {
  id: string
  title: string
  image: any
}

export const EVENT_CATEGORIES: EventCategoryItem[] = [
  {
    id: '1',
    title: 'Dance',
    image: {
      uri: 'https://images.unsplash.com/photo-1508704019882-f9cf40e475b4',
    },
  },
  {
    id: '2',
    title: 'Music',
    image: {
      uri: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    },
  },
  {
    id: '3',
    title: 'Art',
    image: {
      uri: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19',
    },
  },
  {
    id: '4',
    title: 'Sports',
    image: {
      uri: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d',
    },
  },
  {
    id: '5',
    title: 'Photography',
    image: {
      uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    },
  },
]
