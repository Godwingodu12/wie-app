import { Request, Response } from 'express';
import { SettlementService } from '../services/settlementService';

export const getPlatformEarnings = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const earnings = await SettlementService.getPlatformEarnings(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: earnings,
    });
  } catch (error: any) {
    console.error('❌ Error fetching platform earnings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingSettlements = async (req: Request, res: Response) => {
  try {
    const settlements = await SettlementService.getPendingSettlements();

    res.json({
      success: true,
      data: settlements,
    });
  } catch (error: any) {
    console.error('❌ Error fetching pending settlements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrganizationSettlements = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    const settlements = await SettlementService.getOrganizationSettlements(
      groupId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: settlements,
    });
  } catch (error: any) {
    console.error('❌ Error fetching organization settlements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processSettlement = async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;

    const settlement = await SettlementService.processSettlement(settlementId);

    res.json({
      success: true,
      message: 'Settlement processing initiated',
      data: settlement,
    });
  } catch (error: any) {
    console.error('❌ Error processing settlement:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSettlementStats = async (req: Request, res: Response) => {
  try {
    const stats = await SettlementService.getSettlementStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Error fetching settlement stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
