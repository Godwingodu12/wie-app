import express from 'express';
import * as profileService from '../services/profile.service';
import * as uploadControllerService from '../services/upload.controller.service';
import { upload } from '../services/upload.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Profile management routes
router.post('/create-profile', profileService.createProfile);
router.get('/get-profile', profileService.getProfile);
router.get('/get-profile/:profileId', profileService.getProfileById);
router.put('/update-profile', profileService.updateProfile);
router.patch('/update-status', profileService.updateStatus);
router.patch('/update-privacy', profileService.updatePrivacySettings);
router.post('/accept-terms', profileService.acceptTerms);
router.post('/add-photos', profileService.addPhotos);
router.patch('/increment-analytics', profileService.incrementAnalytics);

// Photo management routes
router.post('/upload-photos', upload.array('photos', 8), uploadControllerService.uploadProfilePhotos);
router.delete('/delete-photo/:publicId', uploadControllerService.deleteProfilePhoto);
router.patch('/set-primary-photo', uploadControllerService.setPrimaryPhoto);

export default router;