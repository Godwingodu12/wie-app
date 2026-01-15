export interface CreateProfileDTO {
  displayName: string;
  dateOfBirth: string;
  gender: string;
  location: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  qualifications: string[];
  personalDescription?: string;
}

export interface UpdateProfileDTO {
  displayName?: string;
  sexualOrientation?: {
    type: string;
    private?: boolean;
  };
  profession?: any;
  educationLevel?: string;
  hometown?: {
    city: string;
    state: string;
    country: string;
  };
  hobbies?: Array<{
    category: string;
    name: string;
    level?: string;
  }>;
  interests?: Array<{
    category: string;
    tags: string[];
  }>;
  personalDescription?: string;
}

export interface ConnectionRequestDTO {
  toUserId: string;
  purposeCode: string;
  purposeDataId: string;
  message?: string;
}

export interface MatchFilters {
  gender?: string;
  ageRange?: {
    min: number;
    max: number;
  };
  maxDistance?: number;
  interests?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  contactNo?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
