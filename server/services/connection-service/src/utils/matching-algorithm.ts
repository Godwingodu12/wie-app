import ConnectionProfile from '../models/ConnectionProfile';
import { EstablishedConnection } from '../models/EstablishedConnection';
import mongoose from 'mongoose';

export interface MatchWeights {
  mutuals: number;
  location: number;
  interests: number;
  personality: number;
}

export interface MatchScore {
  totalScore: number;
  breakdown: {
    mutuals: number;
    location: number;
    interests: number;
    personality: number;
  };
  reasons: string[];
}

export class MatchingAlgorithm {
  // Default weights (can be adjusted per purpose)
  private defaultWeights: MatchWeights = {
    mutuals: 0.35,
    location: 0.3,
    interests: 0.2,
    personality: 0.15,
  };

  // Purpose-specific weight adjustments
  private purposeWeights: Record<string, MatchWeights> = {
    RELATIONSHIP: { mutuals: 0.2, location: 0.25, interests: 0.25, personality: 0.3 },
    TRAVEL: { mutuals: 0.15, location: 0.2, interests: 0.35, personality: 0.3 },
    PROFESSIONAL: { mutuals: 0.4, location: 0.15, interests: 0.3, personality: 0.15 },
    LOCATION: { mutuals: 0.15, location: 0.5, interests: 0.2, personality: 0.15 },
    MENTAL_SUPPORT: { mutuals: 0.1, location: 0.1, interests: 0.2, personality: 0.6 },
    CONCERT: { mutuals: 0.2, location: 0.35, interests: 0.35, personality: 0.1 },
  };

  // Calculate match score between two users
  async calculateMatchScore(
    userId1: string,
    userId2: string,
    purposeCode: string = 'GENERAL'
  ): Promise<MatchScore> {
    const profile1 = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId1) });
    const profile2 = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId2) });

    if (!profile1 || !profile2) {
      throw new Error('Profile not found');
    }

    const weights = this.purposeWeights[purposeCode] || this.defaultWeights;

    // Calculate individual scores
    const mutualsScore = await this.calculateMutualsScore(userId1, userId2);
    const locationScore = this.calculateLocationScore(profile1, profile2);
    const interestsScore = this.calculateInterestsScore(profile1, profile2);
    const personalityScore = this.calculatePersonalityScore(profile1, profile2);

    // Calculate weighted total
    const totalScore =
      mutualsScore * weights.mutuals +
      locationScore * weights.location +
      interestsScore * weights.interests +
      personalityScore * weights.personality;

    // Generate match reasons
    const reasons = this.generateMatchReasons(
      mutualsScore,
      locationScore,
      interestsScore,
      personalityScore,
      profile1,
      profile2
    );

    return {
      totalScore: Math.round(totalScore),
      breakdown: {
        mutuals: Math.round(mutualsScore * weights.mutuals),
        location: Math.round(locationScore * weights.location),
        interests: Math.round(interestsScore * weights.interests),
        personality: Math.round(personalityScore * weights.personality),
      },
      reasons,
    };
  }

  // Calculate mutual connections score (0-100)
  private async calculateMutualsScore(userId1: string, userId2: string): Promise<number> {
    try {
      const user1Connections = await EstablishedConnection.find({
        $or: [{ user1Id: userId1 }, { user2Id: userId1 }],
        status: 'active',
      });

      const user2Connections = await EstablishedConnection.find({
        $or: [{ user1Id: userId2 }, { user2Id: userId2 }],
        status: 'active',
      });

      // Extract connection IDs
      const user1ConnectedIds = user1Connections.map((c) =>
        c.user1Id.toString() === userId1 ? c.user2Id.toString() : c.user1Id.toString()
      );

      const user2ConnectedIds = user2Connections.map((c) =>
        c.user1Id.toString() === userId2 ? c.user2Id.toString() : c.user1Id.toString()
      );

      // Find mutual connections
      const mutualCount = user1ConnectedIds.filter((id) => user2ConnectedIds.includes(id)).length;

      // Score based on mutual count (diminishing returns)
      if (mutualCount === 0) return 0;
      if (mutualCount <= 2) return 40 + mutualCount * 10;
      if (mutualCount <= 5) return 60 + (mutualCount - 2) * 8;
      return Math.min(100, 84 + (mutualCount - 5) * 3);
    } catch (error) {
      return 0;
    }
  }

  // Calculate location proximity score (0-100)
  private calculateLocationScore(profile1: any, profile2: any): number {
    const coords1 = profile1.location.coordinates.coordinates;
    const coords2 = profile2.location.coordinates.coordinates;

    const distance = this.calculateDistance(coords1[1], coords1[0], coords2[1], coords2[0]);

    // Score decreases exponentially with distance
    const maxDistance = 100; // km
    const normalizedDistance = Math.min(distance / maxDistance, 1);
    const score = 100 * (1 - Math.pow(normalizedDistance, 2));

    return Math.max(0, Math.round(score));
  }

  // Calculate interests overlap score (0-100) using Jaccard similarity
  private calculateInterestsScore(profile1: any, profile2: any): number {
    // Combine hobbies and interests
    const interests1 = new Set([
      ...profile1.hobbies.map((h: any) => h.name.toLowerCase()),
      ...profile1.interests.flatMap((i: any) => i.tags.map((t: string) => t.toLowerCase())),
    ]);

    const interests2 = new Set([
      ...profile2.hobbies.map((h: any) => h.name.toLowerCase()),
      ...profile2.interests.flatMap((i: any) => i.tags.map((t: string) => t.toLowerCase())),
    ]);

    // Jaccard similarity
    const intersection = new Set([...interests1].filter((x) => interests2.has(x)));
    const union = new Set([...interests1, ...interests2]);

    if (union.size === 0) return 0;

    const similarity = intersection.size / union.size;
    return Math.round(similarity * 100);
  }

  // Calculate personality compatibility score (0-100)
  private calculatePersonalityScore(profile1: any, profile2: any): number {
    // Placeholder - in production, this would use ML personality scores
    // For now, return a baseline score based on age similarity and other factors

    const ageDiff = Math.abs(profile1.age - profile2.age);
    let ageScore = 100;

    if (ageDiff <= 3) ageScore = 100;
    else if (ageDiff <= 5) ageScore = 90;
    else if (ageDiff <= 10) ageScore = 70;
    else if (ageDiff <= 15) ageScore = 50;
    else ageScore = 30;

    // Consider education level similarity
    let educationScore = 70; // default
    if (profile1.educationLevel === profile2.educationLevel) {
      educationScore = 90;
    }

    // Average the scores
    return Math.round((ageScore * 0.6 + educationScore * 0.4));
  }

  // Haversine formula to calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Generate human-readable match reasons
  private generateMatchReasons(
    mutualsScore: number,
    locationScore: number,
    interestsScore: number,
    personalityScore: number,
    profile1: any,
    profile2: any
  ): string[] {
    const reasons: string[] = [];

    if (mutualsScore >= 50) {
      reasons.push('You have mutual connections');
    }

    if (locationScore >= 70) {
      reasons.push('Lives nearby');
    } else if (locationScore >= 40) {
      reasons.push('In the same region');
    }

    if (interestsScore >= 60) {
      reasons.push('Shares many interests with you');
    } else if (interestsScore >= 30) {
      reasons.push('Has some common interests');
    }

    if (personalityScore >= 70) {
      reasons.push('Compatible personality traits');
    }

    // Add specific interest matches
    const commonInterests = this.findCommonInterests(profile1, profile2);
    if (commonInterests.length > 0) {
      reasons.push(`Both interested in ${commonInterests.slice(0, 2).join(', ')}`);
    }

    return reasons;
  }

  // Find specific common interests
  private findCommonInterests(profile1: any, profile2: any): string[] {
    const interests1 = new Set([
      ...profile1.hobbies.map((h: any) => h.name),
      ...profile1.interests.flatMap((i: any) => i.tags),
    ]);

    const interests2 = new Set([
      ...profile2.hobbies.map((h: any) => h.name),
      ...profile2.interests.flatMap((i: any) => i.tags),
    ]);

    return [...interests1].filter((x) => interests2.has(x));
  }

  // Find potential matches based on purpose
  async findMatches(
    userId: string,
    purposeCode: string,
    filters: any = {},
    limit: number = 50
  ): Promise<any[]> {
    const userProfile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Build query
    const query: any = {
      userId: { $ne: new mongoose.Types.ObjectId(userId) },
      status: 'active',
    };

    // Apply filters
    if (filters.gender) {
      query.gender = filters.gender;
    }

    if (filters.ageRange) {
      query.age = {
        $gte: filters.ageRange.min,
        $lte: filters.ageRange.max,
      };
    }

    if (filters.maxDistance) {
      // Geospatial query
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userProfile.location.coordinates.coordinates,
          },
          $maxDistance: filters.maxDistance * 1000, // Convert km to meters
        },
      };
    }

    // Get potential matches
    const potentialMatches = await ConnectionProfile.find(query).limit(limit * 3); // Get more for scoring

    // Calculate scores for each match
    const scoredMatches = await Promise.all(
      potentialMatches.map(async (match) => {
        const score = await this.calculateMatchScore(userId, match.userId.toString(), purposeCode);
        return {
          profile: match,
          score,
        };
      })
    );

    // Sort by score and return top matches
    return scoredMatches
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
      .slice(0, limit)
      .map((m) => ({
        ...m.profile.toObject(),
        matchScore: m.score.totalScore,
        matchBreakdown: m.score.breakdown,
        matchReasons: m.score.reasons,
      }));
  }
}

export default new MatchingAlgorithm();