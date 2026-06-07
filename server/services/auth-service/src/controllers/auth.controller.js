import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
import mongoose from 'mongoose';
import { hashPassword, comparePassword } from "../utils/hash.js";
import upload, { uploadToCloudinary, deleteFromCloudinary } from "../middlewares/upload.js";
import { findAllActiveUsersService, getFollowersData,getFollowersService } from "../services/auth.service.js";
const validatePassword = (password) => {
  return password && password.length >= 6;
};
const validateName = (name) => {
  return name && name.trim().length >= 2;
};
// Find all active users - HTTP ENDPOINT
export const AllActiveUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User authentication required."
      });
    }
    const userId = req.user._id || req.user.id;
    const { query } = req.query; // Get search query from URL params
    // Call the service function
    const users = await findAllActiveUsersService(userId, query);
    // Format users
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      contact_no: user.contact_no,
      organisation_type: user.organisation_type,
      followers: user.followers,
      following: user.following,
      website: user.website,
      bio: user.bio,
      gender: user.gender,
      status: user.status,
      address: user.address,
      image: user.image,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.status(200).json({
      success: true,
      message: "Active users retrieved successfully",
      users: formattedUsers,
      count: formattedUsers.length
    });
  } catch (err) {
    console.error("❌ Find all users error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during user retrieval",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
export const followUser = async (req, res) => {
  try {
    const userIdToFollow = req.params.otherId;
    const currentUserId = req.user._id || req.user.id || req.user.userId;

    if (currentUserId.toString() === userIdToFollow.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Verify both users exist and are active
    const [userToFollow, currentUser] = await Promise.all([
      User.findOne({ _id: userIdToFollow, status: 'active' }).select('_id followers'),
      User.findOne({ _id: currentUserId, status: 'active' }).select('_id following')
    ]);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: userIdToFollow,
      status: 'active'
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    // Create follow relationship
    const followRecord = new Follow({
      follower: currentUserId,
      following: userIdToFollow,
      status: 'active'
    });

    await followRecord.save();

    // Get updated counts
    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userIdToFollow, status: 'active' }),
      Follow.countDocuments({ follower: currentUserId, status: 'active' })
    ]);

    // Update user counts - ensure string conversion
    await Promise.all([
      User.findByIdAndUpdate(
        userIdToFollow,
        { 
          followers: followerCount.toString(),
          $set: { updatedAt: new Date() }
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        currentUserId,
        { 
          following: followingCount.toString(),
          $set: { updatedAt: new Date() }
        },
        { new: true }
      )
    ]);

    return res.status(200).json({
      message: 'Successfully followed user',
      success: true,
      following: followingCount.toString(),
      followers: followerCount.toString(),
      isFollowing: true
    });
  } catch (error) {
    console.error('Error following user:', error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You are already following this user' });
    }
    
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const unfollowUser = async (req, res) => {
  try {
    const userIdToUnfollow = req.params.otherId;
    const currentUserId = req.user._id || req.user.id || req.user.userId;

    if (currentUserId.toString() === userIdToUnfollow.toString()) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    // Verify both users exist and are active
    const [userToUnfollow, currentUser] = await Promise.all([
      User.findOne({ _id: userIdToUnfollow, status: 'active' }).select('_id followers'),
      User.findOne({ _id: currentUserId, status: 'active' }).select('_id following')
    ]);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Find and delete follow relationship
    const followRecord = await Follow.findOne({
      follower: currentUserId,
      following: userIdToUnfollow,
      status: 'active'
    });

    if (!followRecord) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Delete the follow relationship
    await Follow.deleteOne({ _id: followRecord._id });

    // Get updated counts
    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userIdToUnfollow, status: 'active' }),
      Follow.countDocuments({ follower: currentUserId, status: 'active' })
    ]);

    // Update user counts - ensure string conversion
    await Promise.all([
      User.findByIdAndUpdate(
        userIdToUnfollow,
        { 
          followers: followerCount.toString(),
          $set: { updatedAt: new Date() }
        },
        { new: true }
      ),
      User.findByIdAndUpdate(
        currentUserId,
        { 
          following: followingCount.toString(),
          $set: { updatedAt: new Date() }
        },
        { new: true }
      )
    ]);

    return res.status(200).json({
      message: 'Successfully unfollowed user',
      success: true,
      following: followingCount.toString(),
      followers: followerCount.toString(),
      isFollowing: false
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [followers, totalCount] = await Promise.all([
      Follow.find({ following: userId, status: 'active' })
        .select('follower')
        .populate('follower', 'name image email')
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ following: userId, status: 'active' })
    ]);

    return res.status(200).json({
      followers: followers.map(f => f.follower),
      totalCount,
      page,
      pages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const getAllFollowers = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id || req.user.id;
    const activeFollowers = await getFollowersService(userId);
    return res.status(200).json({
      success: true,
      activeFollowers,
      count: activeFollowers.length
    });
  } catch (error) {
    console.error('❌ Error fetching followers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch followers'
    });
  }
};
export const getAllFollowing = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;
    const following = await Follow.find({ follower: userId, status: 'active' })
      .select('following createdAt')
      .populate({
        path: 'following',
        select: 'name image email isActive status bio location',
        model: 'User'
      })
      .sort({ createdAt: -1 }) 
      .lean();
    const processedFollowing = following
      .filter(f => f.following)
      .map(f => ({
        _id: f.following._id,
        name: f.following.name,
        image: f.following.image,
        email: f.following.email,
        bio: f.following.bio,
        location: f.following.location,
        followedAt: f.createdAt,
        isActiveUser: f.following.isActive === true || f.following.status === 'active'
      }));
    // Separate active and inactive following users
    const activeFollowing = processedFollowing.filter(f => f.isActiveUser);
    const inactiveFollowing = processedFollowing.filter(f => !f.isActiveUser);

    return res.status(200).json({
      success: true,
      totalCount: processedFollowing.length,
      activeFollowingCount: activeFollowing.length,
      inactiveFollowingCount: inactiveFollowing.length,
      following: processedFollowing,
      activeFollowing,
      inactiveFollowing
    });
  } catch (error) {
    console.error('Error fetching all following:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [following, totalCount] = await Promise.all([
      Follow.find({ follower: userId, status: 'active' })
        .select('following')
        .populate('following', 'name image email')
        .skip(skip)
        .limit(limit)
        .lean(),
      Follow.countDocuments({ follower: userId, status: 'active' })
    ]);

    return res.status(200).json({
      following: following.map(f => f.following),
      totalCount,
      page,
      pages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const isFollowing = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id || req.user.userId;
    const targetUserId = req.params.otherId;
    const follow = await Follow.findOne({
      follower: currentUserId,
      following: targetUserId,
      status: 'active'
    }).lean();
    return res.status(200).json({
      isFollowing: !!follow
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
export const othersAllFollowers = async (req, res) => {
  try {
    const otherUserId = req.params.otherId;
    // Validate userId
    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Validate if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    console.log(`📋 Fetching followers for user: ${otherUserId}`);

    // Find all follow relationships where this user is being followed
    const followRelationships = await Follow.find({
      following: otherUserId,
      status: 'active'
    })
    .populate({
      path: 'follower',
      select: '_id name email username image status contact_no bio organisation_type role',
      match: { status: 'active' }
    })
    .lean();

    console.log(`📊 Found ${followRelationships.length} follow relationships`);

    // Filter out null followers (inactive users) and map to clean objects
    const activeFollowers = followRelationships
      .filter(f => f.follower !== null)
      .map(f => ({
        _id: f.follower._id,
        name: f.follower.name,
        email: f.follower.email,
        username: f.follower.username,
        image: f.follower.image,
        status: f.follower.status,
        contact_no: f.follower.contact_no,
        bio: f.follower.bio,
        organisation_type: f.follower.organisation_type,
        role: f.follower.role
      }));

    console.log(`✅ Returning ${activeFollowers.length} active followers`);

    // Return proper response
    return res.status(200).json({
      success: true,
      activeFollowers: activeFollowers,
      count: activeFollowers.length
    });

  } catch (error) {
    console.error('❌ Error fetching followers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch followers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
export const othersAllFollowing = async (req, res) => {
  try {
   const otherUserId = req.params.otherId;
    const following = await Follow.find({ follower: otherUserId, status: 'active' })
      .select('following createdAt')
      .populate({
        path: 'following',
        select: 'name image email isActive status bio location',
        model: 'User'
      })
      .sort({ createdAt: -1 }) 
      .lean();
    const processedFollowing = following
      .filter(f => f.following)
      .map(f => ({
        _id: f.following._id,
        name: f.following.name,
        image: f.following.image,
        email: f.following.email,
        bio: f.following.bio,
        location: f.following.location,
        followedAt: f.createdAt,
        isActiveUser: f.following.isActive === true || f.following.status === 'active'
      }));
    // Separate active and inactive following users
    const activeFollowing = processedFollowing.filter(f => f.isActiveUser);
    const inactiveFollowing = processedFollowing.filter(f => !f.isActiveUser);
    return res.status(200).json({
      success: true,
      totalCount: processedFollowing.length,
      activeFollowingCount: activeFollowing.length,
      inactiveFollowingCount: inactiveFollowing.length,
      following: processedFollowing,
      activeFollowing,
      inactiveFollowing
    });
  } catch (error) {
    console.error('Error fetching all following:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};
export const googleAuth = (req, res, next) => {
  if (req.user && req.user._id) {
    req.session.userId = req.user._id.toString();
  }
  next();
};
export const googleCallback = async (req, res) => {
  try {
    const userId = req.session.userId;
    const socialData = req.user;

    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=authentication_required`);
    }

    // Update user with Google profile link
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        'social_links.google': socialData.profileUrl,
        $set: { 
          [`social_profiles.google`]: {
            profileId: socialData.profileId,
            displayName: socialData.displayName,
            email: socialData.email,
            photo: socialData.photo,
            linkedAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Clear session
    delete req.session.userId;

    res.redirect(`${process.env.CLIENT_URL}/settings?success=google_linked`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=google_link_failed`);
  }
};
// Facebook OAuth Controllers
export const facebookAuth = (req, res, next) => {
  if (req.user && req.user._id) {
    req.session.userId = req.user._id.toString();
  }
  next();
};

export const facebookCallback = async (req, res) => {
  try {
    const userId = req.session.userId;
    const socialData = req.user;

    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=authentication_required`);
    }

    await User.findByIdAndUpdate(
      userId,
      { 
        'social_links.facebook': socialData.profileUrl,
        $set: { 
          [`social_profiles.facebook`]: {
            profileId: socialData.profileId,
            displayName: socialData.displayName,
            email: socialData.email,
            photo: socialData.photo,
            linkedAt: new Date()
          }
        }
      },
      { new: true }
    );

    delete req.session.userId;
    res.redirect(`${process.env.CLIENT_URL}/settings?success=facebook_linked`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=facebook_link_failed`);
  }
};

// Twitter/X OAuth Controllers
export const twitterAuth = (req, res, next) => {
  if (req.user && req.user._id) {
    req.session.userId = req.user._id.toString();
  }
  next();
};

export const twitterCallback = async (req, res) => {
  try {
    const userId = req.session.userId;
    const socialData = req.user;

    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=authentication_required`);
    }

    await User.findByIdAndUpdate(
      userId,
      { 
        'social_links.x': socialData.profileUrl,
        $set: { 
          [`social_profiles.x`]: {
            profileId: socialData.profileId,
            displayName: socialData.displayName,
            username: socialData.username,
            photo: socialData.photo,
            linkedAt: new Date()
          }
        }
      },
      { new: true }
    );

    delete req.session.userId;
    res.redirect(`${process.env.CLIENT_URL}/settings?success=twitter_linked`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=twitter_link_failed`);
  }
};

// Instagram OAuth Controllers
export const instagramAuth = (req, res, next) => {
  if (req.user && req.user._id) {
    req.session.userId = req.user._id.toString();
  }
  next();
};

export const instagramCallback = async (req, res) => {
  try {
    const userId = req.session.userId;
    const socialData = req.user;

    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=authentication_required`);
    }

    await User.findByIdAndUpdate(
      userId,
      { 
        'social_links.instagram': socialData.profileUrl,
        $set: { 
          [`social_profiles.instagram`]: {
            profileId: socialData.profileId,
            displayName: socialData.displayName,
            username: socialData.username,
            photo: socialData.photo,
            linkedAt: new Date()
          }
        }
      },
      { new: true }
    );

    delete req.session.userId;
    res.redirect(`${process.env.CLIENT_URL}/settings?success=instagram_linked`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=instagram_link_failed`);
  }
};

// LinkedIn OAuth Controllers
export const linkedinAuth = (req, res, next) => {
  if (req.user && req.user._id) {
    req.session.userId = req.user._id.toString();
  }
  next();
};

export const linkedinCallback = async (req, res) => {
  try {
    const userId = req.session.userId;
    const socialData = req.user;

    if (!userId) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?error=authentication_required`);
    }

    await User.findByIdAndUpdate(
      userId,
      { 
        'social_links.linkedin': socialData.profileUrl,
        $set: { 
          [`social_profiles.linkedin`]: {
            profileId: socialData.profileId,
            displayName: socialData.displayName,
            email: socialData.email,
            photo: socialData.photo,
            linkedAt: new Date()
          }
        }
      },
      { new: true }
    );

    delete req.session.userId;
    res.redirect(`${process.env.CLIENT_URL}/settings?success=linkedin_linked`);
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/settings?error=linkedin_link_failed`);
  }
};

// Disconnect social account
export const disconnectSocial = async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user._id;

    const validPlatforms = ['google', 'facebook', 'x', 'instagram', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const updateData = {
      [`social_links.${platform}`]: '',
      $unset: { [`social_profiles.${platform}`]: 1 }
    };

    await User.findByIdAndUpdate(userId, updateData);

    res.json({ success: true, message: `${platform} disconnected successfully` });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
};

// Get connected social accounts
export const getSocialAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('social_links social_profiles');
    res.json({
      social_links: user.social_links,
      social_profiles: user.social_profiles || {}
    });
  } catch (error) {
    console.error('Get social accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch social accounts' });
  }
};
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        message: "Authentication required. Please login again." 
      });
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: "Current password, new password, and confirmation are required" 
      });
    }
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long"
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirmation password do not match"
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password"
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }
    const isPasswordCorrect = await comparePassword(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        message: "Current password is incorrect" 
      });
    }
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.updated_at = new Date();
    await user.save();
    console.log(`Password changed successfully for user: ${userId}`);
    return res.status(200).json({ 
      message: "Password changed successfully",
      userId: userId
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ 
      message: "Failed to change password. Please try again later." 
    });
  }
};
export const personalDetails = async(req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload.fields([
        { name: 'image', maxCount: 1 },
      ])(req, res, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });

    const UserId = req.user._id || req.user.id || req.user.userId;
    if (!UserId) {
      return res.status(401).json({ 
        message: "Authentication required. Please login again." 
      });
    }
    const user = await User.findOne({ _id: UserId, status: 'active'}).select('-password');
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    const originalValues = {
      name: user.name,
      username: user.username,
      email: user.email,
      secondary_email: user.secondary_email,
      contact_no: user.contact_no,
      country_code: user.country_code,
      country_iso2: user.country_iso2,
      address: user.address,
      image: user.image,
    };

    if (req.body.name !== undefined) {
      if (req.body.name.trim() && validateName(req.body.name)) {
        user.name = req.body.name.trim();
      } else if (req.body.name.trim() === '') {
        user.name = originalValues.name;
      }
    }
    if(req.body.username !== undefined){
      if (req.body.username.trim() && validateName(req.body.username)) {
        user.username = req.body.username.trim();
      } else if (req.body.username.trim() === '') {
        user.username = originalValues.username;
      }
    }

    if (req.body.email) user.email = req.body.email;
    if (req.body.secondary_email) user.secondary_email = req.body.secondary_email;
    if (req.body.contact_no) user.contact_no = req.body.contact_no;
    if (req.body.country_code) user.country_code = req.body.country_code;
    if (req.body.country_iso2) user.country_iso2 = req.body.country_iso2;
    if (req.body.address) user.address = req.body.address;
    
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        const imageFile = req.files.image[0];
        const uploadResult = await uploadToCloudinary(imageFile.buffer, {
          folder: 'WIE_AUTH/profile_images',
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });
        
        if (originalValues.image && originalValues.image.includes('cloudinary.com')) {
          try {
            await deleteFromCloudinary(originalValues.image);
            console.log('✅ Old profile image deleted from Cloudinary');
          } catch (deleteError) {
            console.warn('⚠️ Failed to delete old image:', deleteError.message);
          }
        }
        user.image = uploadResult.url;
      } catch (uploadError) {
        console.error('❌ Error uploading image to Cloudinary:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    if (user.role === 'admin') {
      delete userResponse.organisation_type;
    }
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse
    });
  } catch (error) {
    console.error('Error in personalDetails:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile"
    });
  }
};
// Get followers data - HTTP ENDPOINT (alternative route)
export const getFollowersDataHttp = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id || req.user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    console.log('🔍 Fetching followers for user:', userId);

    const activeFollowers = await getFollowersService(userId);

    return res.status(200).json({
      success: true,
      activeFollowers,
      count: activeFollowers.length
    });
  } catch (error) {
    console.error('❌ Error in getFollowersDataHttp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch followers'
    });
  }
};
