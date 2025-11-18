import { Request, Response } from 'express';
import {
  getAllLiveEvents,
  getAllGroups,
  getTicketById,
  getGroupById,
} from '../rabbit/ticketServiceClient';

/**
 * Get all live events (PUBLIC - No auth required)
 */
export const getLiveEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('🎫 Fetching live events for WIE users...');
    
    const result = await getAllLiveEvents();

    res.status(200).json({
      success: true,
      message: 'Live events fetched successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error in getLiveEvents controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live events',
      error: error.message,
    });
  }
};

/**
 * Get all active groups (PUBLIC - No auth required)
 */
export const getActiveGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log('👥 Fetching active groups for WIE users...');
    
    const result = await getAllGroups();

    res.status(200).json({
      success: true,
      message: 'Active groups fetched successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error in getActiveGroups controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active groups',
      error: error.message,
    });
  }
};

/**
 * Get ticket by ID (PUBLIC - No auth required)
 */
export const getTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
      });
      return;
    }

    console.log(`🎫 Fetching ticket ${ticketId} for WIE user...`);
    
    const ticket = await getTicketById(ticketId);

    res.status(200).json({
      success: true,
      message: 'Ticket fetched successfully',
      data: ticket,
    });
  } catch (error: any) {
    console.error('❌ Error in getTicket controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message,
    });
  }
};

/**
 * Get group by ID (PUBLIC - No auth required)
 */
export const getGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({
        success: false,
        message: 'Group ID is required',
      });
      return;
    }

    console.log(`👥 Fetching group ${groupId} for WIE user...`);
    
    const group = await getGroupById(groupId);

    res.status(200).json({
      success: true,
      message: 'Group fetched successfully',
      data: group,
    });
  } catch (error: any) {
    console.error('❌ Error in getGroup controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group',
      error: error.message,
    });
  }
};