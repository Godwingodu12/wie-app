import User from "../models/user.model.js";
export const followUser = async (req, res) => {
  try {
    const userIdToFollow = req.params.otherId;
    const currentUserId = req.user._id || req.user.id || req.user.userId;
    if (currentUserId.toString() === userIdToFollow.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    const userToFollow = await User.findOne({ _id: userIdToFollow, status: 'active' });
    const currentUser = await User.findOne({ _id: currentUserId, status: 'active' });
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    if (!currentUser.followingList) currentUser.followingList = [];
    if (!userToFollow.followersList) userToFollow.followersList = [];
    const isAlreadyFollowing = currentUser.followingList.some(
      id => id.toString() === userIdToFollow.toString()
    );
    if (isAlreadyFollowing) {
      return res.status(400).json({ message: 'You are already following this user' });
    }
    currentUser.followingList.push(userIdToFollow);
    userToFollow.followersList.push(currentUserId);
    currentUser.following = currentUser.followingList.length.toString();
    userToFollow.followers = userToFollow.followersList.length.toString();
    await Promise.all([currentUser.save(), userToFollow.save()]);
    return res.status(200).json({ 
      message: 'Successfully followed user',
      following: currentUser.following,
      followers: userToFollow.followers
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
    const userToUnfollow = await User.findOne({ _id: userIdToUnfollow, status: 'active' });
    const currentUser = await User.findOne({ _id: currentUserId, status: 'active' });
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    if (!currentUser.followingList) currentUser.followingList = [];
    if (!userToUnfollow.followersList) userToUnfollow.followersList = [];
    const isFollowing = currentUser.followingList.some(
      id => id.toString() === userIdToUnfollow.toString()
    );
    if (!isFollowing) {
      return res.status(400).json({ message: 'You are not following this user' });
    }
    currentUser.followingList = currentUser.followingList.filter(
      id => id.toString() !== userIdToUnfollow.toString()
    );
    userToUnfollow.followersList = userToUnfollow.followersList.filter(
      id => id.toString() !== currentUserId.toString()
    );
    currentUser.following = currentUser.followingList.length.toString();
    userToUnfollow.followers = userToUnfollow.followersList.length.toString();
    await Promise.all([currentUser.save(), userToUnfollow.save()]);
    return res.status(200).json({ 
      message: 'Successfully unfollowed user',
      following: currentUser.following,
      followers: userToUnfollow.followers
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// Google OAuth Controllers
export const googleAuth = (req, res, next) => {
  // Store user ID in session to link account later
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
