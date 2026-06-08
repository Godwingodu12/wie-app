export interface MediaItem {
  id: string;
  image: string;
  type: 'post' | 'reel' | 'album' | 'feed' | 'tag';
  stats?: string; // Only needed for reels
}

export const MOCK_HIGHLIGHTS = [
  { id: '1', title: 'New York', image: 'https://picsum.photos/id/230/200/300' },
  { id: '2', title: 'Design', image: 'https://picsum.photos/id/231/200/300' },
  { id: '3', title: 'Met Gala', image: 'https://picsum.photos/id/232/200/300' },
  { id: '4', title: 'Random', image: 'https://picsum.photos/id/233/200/300' },
  { id: '5', title: 'Random', image: 'https://picsum.photos/id/234/200/300' },
];

export const MOCK_POSTS: MediaItem[] = [
  // // Mixed data for the "Post" section
  { 
    id: '1', 
    image: 'https://picsum.photos/id/1/400/600', 
    type: 'post' 
  },
  { 
    id: '2', 
    image: 'https://picsum.photos/id/10/400/600', 
    type: 'reel', 
    stats: '1.2M' 
  },
  { 
    id: '3', 
    image: 'https://picsum.photos/id/20/400/600', 
    type: 'album' 
  },
  { 
    id: '4', 
    image: 'https://picsum.photos/id/30/400/600', 
    type: 'post' 
  },
  { 
    id: '5', 
    image: 'https://picsum.photos/id/40/400/600', 
    type: 'reel', 
    stats: '850K' 
  },
  { 
    id: '6', 
    image: 'https://picsum.photos/id/50/400/600', 
    type: 'album' 
  },
  
];
