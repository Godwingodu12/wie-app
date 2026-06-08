export interface EventData {
    id: string;
    title: string;
    date: string;
    location: string;
    image: string;
    attendees: string[];
  }
  
  export const EVENTS: EventData[] = [
    {
      id: '1',
      title: 'A Study of Great Artists',
      date: '25 January 2025',
      location: 'Malappuram',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
      attendees: [
        'https://i.pravatar.cc/100?u=1',
        'https://i.pravatar.cc/100?u=2',
        'https://i.pravatar.cc/100?u=3',
        'https://i.pravatar.cc/100?u=4',
      ],
    },
    {
      id: '2',
      title: 'Creative Design Workshop',
      date: '10 February 2025',
      location: 'Kochi',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
      attendees: [
        'https://i.pravatar.cc/100?u=5',
        'https://i.pravatar.cc/100?u=6',
        'https://i.pravatar.cc/100?u=7',
      ],
    },
    {
      id: '3',
      title: 'Modern Architecture',
      date: '15 March 2025',
      location: 'Calicut',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
      attendees: [
        'https://i.pravatar.cc/100?u=11',
        'https://i.pravatar.cc/100?u=12',
      ],
    },
  ];
