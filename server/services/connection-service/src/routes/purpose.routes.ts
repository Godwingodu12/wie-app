import express from 'express';
import * as purposeService from '../services/purpose.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Travel Purpose routes
router.post('/create-travel', purposeService.createTravelPurpose);
router.put('/update-travel/:id', purposeService.updateTravelPurpose);
router.get('/get-travel/:id', purposeService.getTravelPurpose);

// Relationship Purpose routes
router.post('/create-relationship', purposeService.createRelationshipPurpose);
router.put('/update-relationship/:id', purposeService.updateRelationshipPurpose);
router.get('/get-relationship/:id', purposeService.getRelationshipPurpose);

// Location Purpose routes
router.post('/create-location', purposeService.createLocationPurpose);
router.put('/update-location/:id', purposeService.updateLocationPurpose);
router.get('/get-location/:id', purposeService.getLocationPurpose);

// Professional Purpose routes
router.post('/create-professional', purposeService.createProfessionalPurpose);
router.put('/update-professional/:id', purposeService.updateProfessionalPurpose);
router.get('/get-professional/:id', purposeService.getProfessionalPurpose);

// Concert Purpose routes
router.post('/create-concert', purposeService.createConcertPurpose);
router.put('/update-concert/:id', purposeService.updateConcertPurpose);
router.get('/get-concert/:id', purposeService.getConcertPurpose);

// Skill Purpose routes
router.post('/create-skill', purposeService.createSkillPurpose);
router.put('/update-skill/:id', purposeService.updateSkillPurpose);
router.get('/get-skill/:id', purposeService.getSkillPurpose);

// Day Outing Purpose routes
router.post('/create-day-outing', purposeService.createDayOutingPurpose);
router.put('/update-day-outing/:id', purposeService.updateDayOutingPurpose);
router.get('/get-day-outing/:id', purposeService.getDayOutingPurpose);

// Get all user purposes
router.get('/get-user-purposes', purposeService.getUserPurposes);

// Delete purpose
router.delete('/delete-purpose/:purposeCode/:id', purposeService.deletePurpose);

// Get purpose by code and ID
router.get('/get-purpose/:purposeCode/:id', purposeService.getPurposeByCodeAndId);

export default router;