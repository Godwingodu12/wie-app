export interface FollowUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isFollowing: boolean;      
  isPrivate: boolean;       
  isRequested?: boolean;     
  isMutual?: boolean;       
  followsMe?: boolean;      
  incomingRequest?: boolean;
  type?: 'followers' | 'following' | 'requested' | 'received'; 
}

export const MOCK_FOLLOW_DATA: FollowUser[] = [
  // Mutual follow, public
  { id: '1', name: 'Gokul Gopalan', username: 'go_Ku_palan', avatar: 'https://picsum.photos/id/1011/200', isFollowing: true, followsMe: true, isPrivate: false, isMutual: true },

  // They follow me (public); I don't follow back -> should be in Followers and Received when my account is public
  { id: '2', name: 'Emman Raducanu', username: 'emma_Ra_ca', avatar: 'https://picsum.photos/id/1027/200', isFollowing: false, followsMe: true, isPrivate: true, incomingRequest: true },

  // Their account is private; I follow them (accepted) -> appears in Following (and Followers if we follow back logic)
  { id: '3', name: 'Messi', username: 'messi_leo', avatar: 'https://picsum.photos/id/1027/200', isFollowing: true, followsMe: false, isPrivate: true },

  // Their account is private; I requested them (pending) -> appears in Requested; if followback accepted, can also appear in Followers per rule 3
  { id: '4', name: 'Sachin Tendulker', username: 'sachin_10', avatar: 'https://picsum.photos/id/1011/200', isFollowing: false, followsMe: false, isPrivate: true, isRequested: true },

  { id: '5', name: 'Halmilton', username: 'hami_l10', avatar: 'https://picsum.photos/id/1027/200', isFollowing: false, followsMe: false, isPrivate: false, incomingRequest: true },
];
