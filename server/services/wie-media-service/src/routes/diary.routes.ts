import express from 'express';
import { authenticate } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import * as diaryController from '../controllers/diary.controller';

const router: express.Router = express.Router();

router.use(authenticate);

// POST /api/diary/create — create new diary
router.post('/create', upload.single('cover'), diaryController.createDiary);

router.get('/user/:userId', diaryController.getUserDiaries);

// GET /api/diary/:diaryId — get single diary
router.get('/:diaryId', diaryController.getDiaryById);

// PATCH /api/diary/:diaryId — edit diary
router.patch('/:diaryId', upload.single('cover'), diaryController.editDiary);

// POST /api/diary/:diaryId/add-flux — add flux to diary
router.post('/:diaryId/add-flux', diaryController.addFluxToDiary);

// DELETE /api/diary/:diaryId/flux/:fluxId — remove flux from diary
router.delete('/:diaryId/flux/:fluxId', diaryController.removeFluxFromDiary);

// DELETE /api/diary/:diaryId — delete diary
router.delete('/:diaryId', diaryController.deleteDiary);

export default router;