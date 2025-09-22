import multer from 'multer';
import { Request } from 'express';
import { uploadToGCS, deleteFromGCS, UploadedFile } from './gcs';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

export interface MediaUploadResult {
  files: UploadedFile[];
  error?: string;
}

export async function handleMediaUpload(req: Request): Promise<MediaUploadResult> {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      throw new Error('No files uploaded');
    }

    const uploadPromises = (req.files as Express.Multer.File[]).map((file) => uploadToGCS(file));
    const uploadedFiles = await Promise.all(uploadPromises);

    return {
      files: uploadedFiles,
    };
  } catch (error) {
    console.error('Error uploading media:', error);
    return {
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function deleteMedia(filename: string): Promise<void> {
  await deleteFromGCS(filename);
}

export { upload };