import connectionApi from './connectionApi';
import { MOCK_MODE } from '../constants/config';

export const connectionService = {
  // Profile Management
  async createProfile(data: any) {
    if (MOCK_MODE) return { message: 'Connection profile created successfully' };
    try {
      const response = await connectionApi.post('/connection-profile/create-profile', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getProfileStatus() {
    if (MOCK_MODE) return { success: true, hasProfile: true, isComplete: true };
    try {
      const response = await connectionApi.get('/connection-profile/profile-status');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async acceptTerms() {
    if (MOCK_MODE) return { success: true };
    try {
      const response = await connectionApi.post('/connection-profile/accept-terms');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async deletePhoto(publicId: string) {
    try {
      const encodedId = encodeURIComponent(publicId);
      const response = await connectionApi.delete(`/connection-profile/delete-photo/${encodedId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async uploadPhotos(photos: string[]) {
    try {
      const formData = new FormData();
      photos.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `photo_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        formData.append('photos', {
          uri,
          name: filename,
          type,
        } as any);
      });

      const response = await connectionApi.post('/connection-profile/upload-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getProfile() {
    if (MOCK_MODE) return { message: 'Profile retrieved successfully', data: {} };
    try {
      const response = await connectionApi.get('/connection-profile/get-profile');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getProfileById(profileId: string) {
    if (MOCK_MODE) return { message: 'Profile retrieved successfully', data: {} };
    try {
      const response = await connectionApi.get(`/connection-profile/get-profile/${profileId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updateProfile(data: any) {
    if (MOCK_MODE) return { message: 'Profile updated successfully' };
    try {
      const response = await connectionApi.put('/connection-profile/update-profile', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async updateOrCreateProfile(data: any) {
    try {
      // Try update first
      return await this.updateProfile(data);
    } catch (error: any) {
      // If not found, try create
      const isNotFound = error === 'Connection profile not found' || 
                        (error.message && error.message.includes('not found')) ||
                        (typeof error === 'string' && error.includes('not found'));
      
      if (isNotFound) {
        // IMPORTANT: When creating a profile, we might need more data than just the update fields.
        // For a wizard flow, we should try to gather what we have from local storage if possible,
        // or just ensure the initial creation happens in the first step.
        // As a safeguard, we merge with some defaults if they are missing.
        const creationData = {
          displayName: 'User',
          age: 18,
          dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - 18)),
          location: {
            city: 'Unknown',
            state: 'Unknown',
            country: 'Unknown',
            longitude: 0,
            latitude: 0,
            coordinates: { type: 'Point', coordinates: [0, 0] }
          },
          gender: 'prefer-not-to-say',
          qualifications: [],
          personalDescription: '',
          ...data
        };
        
        // Ensure age is a valid number
        if (creationData.age === undefined || creationData.age === null || isNaN(Number(creationData.age))) {
          creationData.age = 18;
        }
        
        // Ensure dateOfBirth is a valid Date object and not null/undefined
        if (!creationData.dateOfBirth) {
          creationData.dateOfBirth = new Date(new Date().setFullYear(new Date().getFullYear() - 18));
        }

        return await this.createProfile(creationData);
      }
      throw error;
    }
  },

  // Purpose Management
  async createTravelPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-travel', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createRelationshipPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-relationship', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createProfessionalPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-professional', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createSkillPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-skill', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createDayOutingPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-day-outing', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
  
  async createConcertPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-concert', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async createLocationPurpose(data: any) {
    if (MOCK_MODE) return { message: 'Purpose created successfully' };
    try {
      const response = await connectionApi.post('/connection-purpose/create-location', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Matching & Suggestions
  async getSuggestions(purposeCode: string = 'travel') {
    if (MOCK_MODE) return { success: true, data: [] };
    try {
      const response = await connectionApi.get(`/connection-match/get-suggestions/${purposeCode}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  // Connection Requests
  async getReceivedRequests() {
    if (MOCK_MODE) return { success: true, data: [] };
    try {
      const response = await connectionApi.get('/connection-request/get-received-requests');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async acceptRequest(requestId: string) {
    if (MOCK_MODE) return { success: true };
    try {
      const response = await connectionApi.post(`/connection-request/accept-request/${requestId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async rejectRequest(requestId: string) {
    if (MOCK_MODE) return { success: true };
    try {
      const response = await connectionApi.post(`/connection-request/reject-request/${requestId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async sendRequest(targetProfileId: string, purposeCode: string, purposeId: string) {
    if (MOCK_MODE) return { success: true };
    try {
      const response = await connectionApi.post('/connection-request/send-request', {
        targetProfileId,
        purposeCode,
        purposeId
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
};
