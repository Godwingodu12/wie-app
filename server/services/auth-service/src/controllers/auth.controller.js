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