import { Request, Response } from "express";
import ConnectionProfile from "../models/ConnectionProfile";
import { getUserById } from "../grpc/userClient";
// Create connection profile
export const createProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    // Verify user exists via gRPC
    let user;
    try {
      user = await getUserById(userId);
    } catch (grpcError: any) {
      res.status(500).json({
        success: false,
        message: `Failed to fetch user details: ${grpcError.message}`,
      });
      return;
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if profile already exists
    const existingProfile = await ConnectionProfile.findOne({ userId });
    if (existingProfile) {
      res.status(400).json({
        success: false,
        message: "Connection profile already exists",
      });
      return;
    }

    // Calculate age from DOB
    const birthDate = new Date(req.body.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      res.status(400).json({
        success: false,
        message: "User must be at least 18 years old",
      });
      return;
    }

    // Create profile
    const profile = new ConnectionProfile({
      userId,
      displayName: req.body.displayName,
      dateOfBirth: req.body.dateOfBirth,
      age,
      gender: req.body.gender,
      location: {
        city: req.body.location.city,
        state: req.body.location.state,
        country: req.body.location.country,
        coordinates: {
          type: "Point",
          coordinates: [
            req.body.location.longitude,
            req.body.location.latitude,
          ],
        },
        visibilityRadius: 10,
      },
      qualifications: req.body.qualifications || [],
      personalDescription: req.body.personalDescription,
      status: "draft",
      privacy: {
        hideAccountFromOthers: false,
        restrictVideoCall: false,
        hideNameFromProfile: false,
        hideProfileFromOthers: false,
        visibleOnlyToMutuals: false,
        locationVisibility: "approximate",
      },
      analytics: {
        profileViews: 0,
        connectionsSent: 0,
        connectionsReceived: 0,
        connectionsAccepted: 0,
        averageMatchScore: 0,
      },
    });

    // Calculate completeness
    profile.profileCompleteness = profile.calculateCompleteness();

    await profile.save();

    res.status(201).json({
      success: true,
      data: {
        profileId: profile._id,
        status: profile.status,
        completeness: profile.profileCompleteness,
      },
      message: "Connection profile created successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to create profile: ${error.message}`,
    });
  }
};

// Get profile
export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await ConnectionProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Failed to get profile: ${error.message}`,
    });
  }
};

// Update profile
export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    // Update fields
    Object.assign(profile, req.body);

    // Recalculate completeness
    profile.profileCompleteness = profile.calculateCompleteness();

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to update profile: ${error.message}`,
    });
  }
};
// Accept terms
export const acceptTerms = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    profile.termsAccepted = true;
    profile.termsAcceptedAt = new Date();

    // If profile is complete, activate it
    if (profile.profileCompleteness >= 80) {
      profile.status = "active";
    }

    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        termsAccepted: profile.termsAccepted,
        status: profile.status,
      },
      message: "Terms accepted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to accept terms: ${error.message}`,
    });
  }
};
// Add photos
export const addPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const photos = req.body.photos; // Array of {url, publicId}

    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    // Check photo limit
    if (profile.photos.length + photos.length > 8) {
      res.status(400).json({
        success: false,
        message: "Maximum 8 photos allowed",
      });
      return;
    }

    // Set first photo as primary if no primary exists
    const hasPrimary = profile.photos.some((p) => p.isPrimary);

    photos.forEach((photo: any, index: number) => {
      profile.photos.push({
        url: photo.url,
        publicId: photo.publicId,
        isPrimary: !hasPrimary && index === 0,
        isVerified: false,
        isAIGenerated: false,
        uploadedAt: new Date(),
        status: "pending",
      } as any);
    });

    // Recalculate completeness
    profile.profileCompleteness = profile.calculateCompleteness();

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile,
      message: "Photos added successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to add photos: ${error.message}`,
    });
  }
};

// Update privacy settings
export const updatePrivacySettings = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    profile.privacy = { ...profile.privacy, ...req.body };
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile.privacy,
      message: "Privacy settings updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to update privacy settings: ${error.message}`,
    });
  }
};

// Get profile by ID
export const getProfileById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { profileId } = req.params;
    const profile = await ConnectionProfile.findById(profileId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Failed to get profile by ID: ${error.message}`,
    });
  }
};

// Update profile status
export const updateStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { status } = req.body;

    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message: "Connection profile not found",
      });
      return;
    }

    profile.status = status as any;
    await profile.save();

    res.status(200).json({
      success: true,
      data: { status: profile.status },
      message: "Status updated successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to update status: ${error.message}`,
    });
  }
};

// Increment analytics
export const incrementAnalytics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { field } = req.body;

    await ConnectionProfile.updateOne(
      { userId },
      {
        $inc: { [`analytics.${field}`]: 1 },
        $set: { "analytics.lastActiveAt": new Date() },
      },
    );

    res.status(200).json({
      success: true,
      message: "Analytics incremented successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Failed to increment analytics: ${error.message}`,
    });
  }
};
// GET /api/connection-profile/profile-status
// can redirect them to the exact step they left off at.
export const getProfileStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(200).json({
        success: true,
        hasProfile: false,
        resumeStep: 1,
        resumeSection: "user-details",
        isComplete: false,
        faceVerified: false,
      });
      return;
    }

    const faceVerified = profile.faceVerification?.status === "verified";

    // ── Determine which user-detail step to resume
    const hasBasic =
      !!profile.displayName &&
      !!profile.dateOfBirth &&
      !!profile.location?.city &&
      !!profile.location?.country;

    const hasPhotos = profile.photos.length >= 2;
    const hasOrientation = !!profile.sexualOrientation?.type;
    const hasInterests =
      profile.interests?.some((i) => i.category === "general" && i.tags.length > 0);
    const hasTerms = profile.termsAccepted;
    const hasLookingFor =
      profile.interests?.some((i) => i.category === "looking-for" && i.tags.length > 0);

    let resumeStep = 1;
    let resumeSection: string = "user-details";
    let isComplete = false;

    if (!hasBasic) {
      resumeStep = 1;
      resumeSection = "user-details";
    } else if (!hasPhotos || !faceVerified) {
      resumeStep = 2;
      resumeSection = "user-details";
    } else if (!hasOrientation) {
      resumeStep = 3;
      resumeSection = "user-details";
    } else if (!hasInterests) {
      resumeStep = 4;
      resumeSection = "user-details";
    } else if (!hasTerms) {
      // step 5 (privacy) has defaults so auto-passes; go to 6
      resumeStep = 6;
      resumeSection = "user-details";
    } else if (!hasLookingFor) {
      resumeStep = 7;
      resumeSection = "user-details";
    } else {
      resumeStep = 7;
      resumeSection = "purpose-selection";
      isComplete = true;
    }

    res.status(200).json({
      success: true,
      hasProfile: true,
      resumeStep,
      resumeSection,
      isComplete,
      profileId: profile._id,
      completeness: profile.profileCompleteness,
      faceVerified,
      termsAccepted: profile.termsAccepted,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Failed to get profile status: ${error.message}`,
    });
  }
};

export const getPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const profile = await ConnectionProfile.findOne(
      { userId },
      { photos: 1 }, // only fetch photos field
    );

    if (!profile) {
      res.status(200).json({ success: true, data: { photos: [] } });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        photos: profile.photos,
        count: profile.photos.length,
        canUpload: profile.photos.length < 6,
        remaining: Math.max(0, 6 - profile.photos.length),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
