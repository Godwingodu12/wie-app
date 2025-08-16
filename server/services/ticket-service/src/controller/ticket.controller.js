import Group from "../models/group.model.js";
export const getGroupsTypes = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const groups = await Group.find({ userId: userId });
        const adminGroups = groups.filter(group => group.grp_type === 'admin');
        const orgGroups = groups.filter(group => group.grp_type === 'organisation');
        res.status(200).json({
            message: "Groups retrieved successfully",
            adminCount: adminGroups.length,
            organisationCount: orgGroups.length,
            adminGroups: adminGroups,
            organisationGroups: orgGroups
        });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
