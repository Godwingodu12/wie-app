export const EVENT_DATA = {
  title: "Billie Eilish Concert",
  brand: "Nothing technologies",
  brandImage: 'https://randomuser.me/api/portraits/lego/2.jpg',
  headerImage: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679',
  tags: [
    { label: "Concert" },
    { label: "Music" },
    { label: "16+" },
    { label: "Paid" }, 
  ],
  stats: {
    people: "1,111",
    tickets: "666",
    shares: "666"
  },
  about: {
    dateTime: "25 Jan 2025, Monday 6 PM",
    address: "JN Road, Perinthalmanna, Malappuram",
    price: "$1,499",
    description: "Billie Eilish Pirate Baird O'Connell is an American singer-songwriter and musician. She first gained public attention in 2015 with her debut single Ocean Eyes...",
    guidelines: "Please arrive at least 30 minutes before the event starts. Professional cameras and recording equipment are strictly prohibited."
  },
  dates: ["12 AUG 2025", "13 AUG 2025", "15 AUG 2025"],
  times: ["9:30 AM", "11:30 AM", "12:30 AM", "1:30 PM"],
  guests: [
    { id: '1', name: 'Khureshi', lastName: "Ab'raam", image: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { id: '2', name: 'Zayed', lastName: 'Masood', image: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: '3', name: 'Roger', lastName: 'Federer', image: 'https://randomuser.me/api/portraits/men/3.jpg' },
    { id: '4', name: 'Stan', lastName: 'Wawrinka', image: 'https://randomuser.me/api/portraits/women/4.jpg' },
  ],
  photos: [
    { id: '1', uri: 'https://picsum.photos/400/400?random=1', isVideo: false },
    { id: '2', uri: 'https://picsum.photos/400/400?random=2', isVideo: true },
    { id: '3', uri: 'https://picsum.photos/400/400?random=3', isVideo: true },
    { id: '4', uri: 'https://picsum.photos/400/400?random=4', isVideo: false },
  ],
  hashtags: ["Music", "Concert", "Bacardi", "Kerala"],
  additionalInfo: {
    contacts: [
      { id: '1', name: "Emma Raducanu", email: "emma@gmail.com", phone: "+91 12345 67890", initials: "ER" },
      { id: '2', name: "John Doe", email: "john@gmail.com", phone: "+91 98765 43210", initials: "JD" },
    ],
    prohibitedItems: [
      "Wooden sticks", "Glass bottles", "Lasers", 
      "Professional Cameras", "Alcohol", "Fireworks"
    ],
    moreInfo: [
      { icon: "people-outline", text: "Kids friendly event", isLink: false },
      { icon: "paw-outline", text: "Pets friendly event", isLink: false },
      { icon: "logo-youtube", text: "https://www.youtube.com/billieeilish", isLink: true },
      { icon: "logo-instagram", text: "https://www.instagram.com/billieeilish", isLink: true },
    ]
  }
};
