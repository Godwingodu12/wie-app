
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateProfile = [
  body('displayName').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
  body('gender').isIn(['male', 'female', 'transgender', 'non-binary', 'prefer-not-to-say']),
  body('location.city').notEmpty().withMessage('City is required'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('location.country').notEmpty().withMessage('Country is required'),
  body('location.latitude').isFloat({ min: -90, max: 90 }),
  body('location.longitude').isFloat({ min: -180, max: 180 }),
  body('qualifications').isArray().withMessage('Qualifications must be an array'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateConnectionRequest = [
  body('toUserId').notEmpty().withMessage('Target user ID is required'),
  body('purposeCode').notEmpty().withMessage('Purpose code is required'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];