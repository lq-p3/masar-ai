import { Router } from 'express';
import multer from 'multer';
import { 
  getUserResumes, 
  uploadResumeFile,
  createResumeRecord, 
  setPrimaryResume, 
  deleteResumeRecord 
} from '../controllers/resume.controller.js';
import { requireAuthMiddleware } from '../middleware/auth.middleware.js';
import { AppError } from '../types/api.types.js';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF and DOCX files are allowed', 400, 'INVALID_FILE_TYPE'));
    }
  }
});

const router = Router();

router.use(requireAuthMiddleware);

router.get('/', getUserResumes);
router.post('/upload', upload.single('resume'), uploadResumeFile);
router.post('/', createResumeRecord);
router.patch('/:id/primary', setPrimaryResume);
router.delete('/:id', deleteResumeRecord);

export default router;
