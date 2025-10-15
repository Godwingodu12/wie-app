import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
export const followUser = async (req, res) => {
  try {
    const userIdToFollow = req.params.otherId;
    const currentUserId = req.user._id || req.user.id || req.user.userId;

    if (currentUserId.toString() === userIdToFollow.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    // Verify both users exist and are active
    const [userToFollow, currentUser] = await Promise.all([
      User.findOne({ _id: userIdToFollow, status: 'active' }).select('_id'),
      User.findOne({ _id: currentUserId, status: 'active' }).select('_id')
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

    // Update user counts (optional, for faster retrieval)
    await Promise.all([
      User.updateOne({ _id: userIdToFollow }, { followers: followerCount.toString() }),
      User.updateOne({ _id: currentUserId }, { following: followingCount.toString() })
    ]);

    return res.status(200).json({
      message: 'Successfully followed user',
      following: followingCount.toString(),
      followers: followerCount.toString()
    });
  } catch (error) {
    console.error('Error following user:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
      User.findOne({ _id: userIdToUnfollow, status: 'active' }).select('_id'),
      User.findOne({ _id: currentUserId, status: 'active' }).select('_id')
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

    // Update user counts
    await Promise.all([
      User.updateOne({ _id: userIdToUnfollow }, { followers: followerCount.toString() }),
      User.updateOne({ _id: currentUserId }, { following: followingCount.toString() })
    ]);

    return res.status(200).json({
      message: 'Successfully unfollowed user',
      following: followingCount.toString(),
      followers: followerCount.toString()
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
