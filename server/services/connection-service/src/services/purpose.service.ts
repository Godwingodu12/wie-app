import { Request, Response } from 'express';
import TravelPurpose from '../models/TravelPurpose';
import SkillPurpose from '../models/SkillPurpose';
import DayOutingPurpose from '../models/DayOutingPurpose';
import ConcertPurpose from '../models/ConcertPurpose';
import { RelationshipPurpose } from '../models/RelationshipPurpose';
import { LocationPurpose } from '../models/LocationPurpose';
import { ProfessionalPurpose } from '../models/ProfessionalPurpose';
import ConnectionProfile from '../models/ConnectionProfile';
import mongoose from 'mongoose';

// Create Travel Purpose
export const createTravelPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    const purpose = new TravelPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Travel purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Travel Purpose
export const updateTravelPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await TravelPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Travel purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Travel purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Travel Purpose
export const getTravelPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await TravelPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Travel purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Relationship Purpose
export const createRelationshipPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    const purpose = new RelationshipPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Relationship purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Relationship Purpose
export const updateRelationshipPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await RelationshipPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Relationship purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Relationship purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Relationship Purpose
export const getRelationshipPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await RelationshipPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Relationship purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Location Purpose
export const createLocationPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    // Set expiry based on urgency
    let expiresAt = new Date();
    switch (req.body.meetingUrgency) {
      case 'right-now':
        expiresAt.setHours(expiresAt.getHours() + 2);
        break;
      case '1-2-hours':
        expiresAt.setHours(expiresAt.getHours() + 4);
        break;
      case 'today':
        expiresAt.setHours(23, 59, 59);
        break;
      default:
        expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const purpose = new LocationPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
      expiresAt,
      isActiveNow: req.body.meetingUrgency === 'right-now',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Location purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Location Purpose
export const updateLocationPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await LocationPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Location purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Location purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Location Purpose
export const getLocationPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await LocationPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Location purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Professional Purpose
export const createProfessionalPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    const purpose = new ProfessionalPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Professional purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Professional Purpose
export const updateProfessionalPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await ProfessionalPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Professional purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Professional purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Professional Purpose
export const getProfessionalPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await ProfessionalPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Professional purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Concert Purpose
export const createConcertPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    const purpose = new ConcertPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Concert purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Concert Purpose
export const updateConcertPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await ConcertPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Concert purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Concert purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Concert Purpose
export const getConcertPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await ConcertPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Concert purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Skill Purpose
export const createSkillPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    const purpose = new SkillPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Skill development purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Skill Purpose
export const updateSkillPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await SkillPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Skill purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Skill development purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Skill Purpose
export const getSkillPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await SkillPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Skill purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Day Outing Purpose
export const createDayOutingPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    const purpose = new DayOutingPurpose({
      connectionProfileId: profile._id,
      userId: new mongoose.Types.ObjectId(userId),
      ...req.body,
      status: 'active',
    });

    await purpose.save();

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Day outing purpose created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Day Outing Purpose
export const updateDayOutingPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purpose = await DayOutingPurpose.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Day outing purpose not found',
      });
      return;
    }

    Object.assign(purpose, req.body);
    await purpose.save();

    res.status(200).json({
      success: true,
      data: purpose,
      message: 'Day outing purpose updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Day Outing Purpose
export const getDayOutingPurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purpose = await DayOutingPurpose.findById(id);
    
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Day outing purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Get User Purposes
export const getUserPurposes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const [travel, relationship, location, professional, concert, skill, dayOuting] = await Promise.all([
      TravelPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
      RelationshipPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
      LocationPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
      ProfessionalPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
      ConcertPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
      SkillPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
      DayOutingPurpose.find({ userId: new mongoose.Types.ObjectId(userId), status: 'active' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        travel,
        relationship,
        location,
        professional,
        concert,
        skill,
        dayOuting,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Purpose
export const deletePurpose = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { purposeCode, id } = req.params;

    const models: Record<string, any> = {
      TRAVEL: TravelPurpose,
      RELATIONSHIP: RelationshipPurpose,
      LOCATION: LocationPurpose,
      PROFESSIONAL: ProfessionalPurpose,
      CONCERT: ConcertPurpose,
      SKILL: SkillPurpose,
      DAY_OUTING: DayOutingPurpose,
    };

    const Model = models[purposeCode];
    if (!Model) {
      res.status(400).json({
        success: false,
        message: 'Invalid purpose code',
      });
      return;
    }

    const purpose = await Model.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Purpose not found',
      });
      return;
    }

    purpose.status = 'deleted';
    await purpose.save();

    res.status(200).json({
      success: true,
      message: 'Purpose deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Purpose by Code and ID
export const getPurposeByCodeAndId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { purposeCode, id } = req.params;

    const models: Record<string, any> = {
      TRAVEL: TravelPurpose,
      RELATIONSHIP: RelationshipPurpose,
      LOCATION: LocationPurpose,
      PROFESSIONAL: ProfessionalPurpose,
      CONCERT: ConcertPurpose,
      SKILL: SkillPurpose,
      DAY_OUTING: DayOutingPurpose,
    };

    const Model = models[purposeCode];
    if (!Model) {
      res.status(400).json({
        success: false,
        message: 'Invalid purpose code',
      });
      return;
    }

    const purpose = await Model.findById(id);
    if (!purpose) {
      res.status(404).json({
        success: false,
        message: 'Purpose not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: purpose,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};