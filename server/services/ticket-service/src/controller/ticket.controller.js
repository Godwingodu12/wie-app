import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
export const getGroupsTypes = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userRole = req.user.role;
        const groups = await Group.find({ userId: userId });
        const adminGroups = groups.filter(group => group.grp_type === 'admin');
        const orgGroups = groups.filter(group => group.grp_type === 'organisation');
        res.status(200).json({
            message: "Groups retrieved successfully",
            adminCount: adminGroups.length,
            userRole: userRole,
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
// Helper function to get all sub-events for a ticket
export const getTicketSubEvents = async (req, res) => {
  const ticketId = req.params.ticketId;
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format" 
    });
  }
  try {
    const ticket = await Ticket.findById(ticketId).select('sub_events event_name');
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      message: "Sub-events retrieved successfully",
      eventName: ticket.event_name,
      subEvents: ticket.sub_events || [],
      totalSubEvents: ticket.sub_events ? ticket.sub_events.length : 0
    });

  } catch (error) {
    console.error("Error getting sub-events:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// Helper function to update a specific sub-event
export const updateSubEvent = async (req, res) => {
  const { ticketId, subEventId } = req.params;
  
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format" 
    });
  }

  try {
    // Handle file uploads
    await new Promise((resolve, reject) => {
      uploadTicketMedia(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(err);
        }
        resolve();
      });
    });

    const userId = req.user._id || req.user.id;
    
    // Get the ticket and find the sub-event
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const subEventIndex = ticket.sub_events.findIndex(se => se._id.toString() === subEventId);
    if (subEventIndex === -1) {
      return res.status(404).json({ message: "Sub-event not found" });
    }

    // Process updates similar to the create logic
    let updateData = req.body;
    if (typeof updateData === 'string') {
      updateData = JSON.parse(updateData);
    }

    // Process any new file uploads
    const processedFiles = {};
    if (req.files) {
      if (req.files.event_banner && req.files.event_banner[0]) {
        processedFiles.event_banner = req.files.event_banner[0].path;
      }
      // Add other file processing as needed
    }

    // Update the specific sub-event
    const updateFields = {};
    Object.keys(updateData).forEach(key => {
      updateFields[`sub_events.${subEventIndex}.${key}`] = updateData[key];
    });

    // Add processed files to update
    Object.keys(processedFiles).forEach(key => {
      updateFields[`sub_events.${subEventIndex}.${key}`] = processedFiles[key];
    });

    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        $set: {
          ...updateFields,
          updated_by: userId,
          updated_at: new Date()
        }
      },
      { new: true }
    );

    res.status(200).json({
      message: "Sub-event updated successfully",
      ticket: updatedTicket,
      updatedSubEvent: updatedTicket.sub_events[subEventIndex]
    });

  } catch (error) {
    console.error("Error updating sub-event:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

// Helper function to delete a specific sub-event
export const deleteSubEvent = async (req, res) => {
  const { ticketId, subEventId } = req.params;
  
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format" 
    });
  }

  try {
    const userId = req.user._id || req.user.id;
    
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        $pull: { sub_events: { _id: subEventId } },
        updated_by: userId,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      message: "Sub-event deleted successfully",
      ticket: updatedTicket,
      remainingSubEvents: updatedTicket.sub_events.length
    });

  } catch (error) {
    console.error("Error deleting sub-event:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};
export const getGroupView = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid ticket ID format"
      });
    }
    const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }
    const groupId = ticket.groupId;
    const group = await Group.findOne({ _id: groupId, userId: userId });
    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }
    res.status(200).json({
      message: "Groups retrieved successfully",
      group: group
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getMyEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const tickets = await Ticket.find({ userId: userId })
        .sort({ createdAt: -1 }) // newest first
        .exec();
        res.status(200).json({
            message: "My All Tickets retrieved successfully",
            tickets: tickets
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};  
export const getMyEventById = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const ticketId = req.params.ticketId;
        if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid ticket ID format"
            });
        }
        const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });
        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }
        res.status(200).json({
            message: "My Ticket retrieved successfully",
            ticket: ticket
        });
    } catch (error) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyLiveEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: userId, 
            status: 'live',
            event_start_date: { $lte: currentDate },
            event_end_date: { $gte: currentDate }
        });
        res.status(200).json({
            message: "My Live Tickets retrieved successfully",
            tickets: tickets
        });
    }
    catch (error) {
        console.error("Error fetching live tickets:", error);
        res.status(500).json({  
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyLiveEventView = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const ticketId = req.params.ticketId;
        if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid ticket ID format"
            });
        }
        const currentDate = new Date();
        const ticket = await Ticket.findOne({ 
            _id: ticketId,
            userId: userId,
            status: 'live',
            event_start_date: { $lte: currentDate },
            event_end_date: { $gte: currentDate }
        });
        if (!ticket) {
            return res.status(404).json({
                message: "Live Ticket not found"
            });
        }
        res.status(200).json({
            message: "My Live Ticket View retrieved successfully",
            ticket: ticket
        });
    }
    catch (error) {
        console.error("Error fetching live ticket:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyPastEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: userId,
            status: 'completed',
            event_end_date: { $lt: currentDate }
        });
        res.status(200).json({
            message: "My Past Tickets retrieved successfully",
            tickets: tickets
        });
    }
    catch (error) {
        console.error("Error fetching past tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyUpcomingEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: userId,
            status: 'pending',
            event_start_date: { $gt: currentDate }
        });
        res.status(200).json({
            message: "My Upcoming Tickets retrieved successfully",
            tickets: tickets
        });
    } catch (error) {
        console.error("Error fetching upcoming tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getOthersEvents = async(req, res)=>{
  try {
      const other = req.params.otherId;
      const tickets = await Ticket.find({ 
                userId: other,
                status: ['completed','live']
            });
      res.status(200).json({
            message: "Other User Tickets retrieved successfully",
            tickets: tickets
        });
  } catch (error) {
    console.error("Error fetching Others tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
  }
};
export const getOtherLiveEvents = async(req, res)=>{
  try {
      const other = req.params.otherId;
      const currentDate = new Date();
      const tickets = await Ticket.find({ 
                userId: other,
                status: 'live',
                event_start_date: { $lte: currentDate },
                event_end_date: { $gte: currentDate }
            });
      res.status(200).json({
            message: "Other User Live Tickets retrieved successfully",
            tickets: tickets
        });
  } catch (error) {
    console.error("Error fetching Others Live tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
  }
};
export const getOthersPastEvents = async (req, res) => {
    try {
        const other = req.params.otherId;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: other,
            status: 'completed',
            event_end_date: { $lt: currentDate }
        });
        res.status(200).json({
            message: "other user Past Tickets retrieved successfully",
            tickets: tickets
        });
    }
    catch (error) {
        console.error("Error fetching past tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
import mongoose from 'mongoose';

export const getGroupTicketPercentages = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Fetch all groups for the user
    const groups = await Group.find({ userId: userId }).sort({ createdAt: -1 });
    
    if (groups.length === 0) {
      return res.status(200).json({
        message: "No groups found for this user",
        groupPercentages: {}
      });
    }
    
    // Ensure groupIds are ObjectIds
    const groupIds = groups.map(g => new mongoose.Types.ObjectId(g._id));
    
    console.log("Group IDs:", groupIds);
    
    // First, let's check if there are any tickets at all
    const totalTicketsCheck = await Ticket.countDocuments({
      groupId: { $in: groupIds }
    });
    
    console.log("Total tickets found:", totalTicketsCheck);
    
    // Single aggregation query to get ticket counts per group
    const ticketStats = await Ticket.aggregate([
      {
        $match: {
          groupId: { $in: groupIds },
          status: { $in: ['live', 'completed', 'pending'] }
        }
      },
      {
        $group: {
          _id: "$groupId",
          ticketCount: { $sum: 1 }
        }
      }
    ]);
    
    console.log("Ticket Stats from aggregation:", ticketStats);
    
    // Calculate total tickets
    const totalTickets = ticketStats.reduce((sum, stat) => sum + stat.ticketCount, 0);
    
    if (totalTickets === 0) {
      return res.status(200).json({
        message: "No tickets found for any group",
        groupPercentages: {},
        debug: {
          totalGroupsFound: groups.length,
          groupIds: groupIds.map(id => id.toString()),
          totalTicketsInDB: totalTicketsCheck
        }
      });
    }
    
    // Create a map for ticket counts
    const ticketCountMap = {};
    ticketStats.forEach(stat => {
      ticketCountMap[stat._id.toString()] = stat.ticketCount;
    });
    
    // Calculate percentages for each group
    const groupPercentages = {};
    
    groups.forEach(group => {
      const groupTicketCount = ticketCountMap[group._id.toString()] || 0;
      const percentage = parseFloat(((groupTicketCount / totalTickets) * 100).toFixed(2));
      groupPercentages[group.name] = `${percentage}%`;
    });
    
    res.status(200).json({
      message: "Group ticket percentages retrieved successfully",
      totalTickets: totalTickets,
      groupPercentages: groupPercentages
    });
    
  } catch (error) {
    console.error("Error fetching group ticket percentages:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getGroupStatistics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groups = await Group.find({ userId: userId }).sort({ createdAt: -1 });
    const groupCount = groups.length;
    if (groups.length === 0) {
      return res.status(200).json({
        message: "No groups found for this user",
        groupPercentages: {}
      });
    }
    const groupTicketCounts = await Promise.all(
      groups.map(async (group) => {
        const ticketCount = await Ticket.countDocuments({
          groupId: group._id,
          event_status: { $in: ['pending', 'confirmed', 'live', 'completed'] }
        });
        return {
          groupId: group._id,
          groupName: group.name,
          ticketCount: ticketCount
        };
      })
    );
    const totalTickets = groupTicketCounts.reduce((sum, group) => sum + group.ticketCount, 0);
    if (totalTickets === 0) {
      return res.status(200).json({
        message: "No tickets found for any group",
        groupPercentages: {},
        debug: {
          groupTicketCounts: groupTicketCounts
        }
      });
    }
    const groupPercentages = {};
    groupTicketCounts.forEach(group => {
      const percentage = parseFloat(((group.ticketCount / totalTickets) * 100).toFixed(2));
      groupPercentages[group.groupName] = `${percentage}%`;
    });
    res.status(200).json({
      message: "Group ticket percentages retrieved successfully",
      groupCount: groupCount,
      groupTicketCounts: groupTicketCounts,
      totalTickets: totalTickets,
      groupPercentages: groupPercentages
    });
  } catch (error) {
    console.error("Error fetching group ticket percentages:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

