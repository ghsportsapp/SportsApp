import { Storage } from '@google-cloud/storage';
import path from 'path';

// Create a new instance of the Storage class
const storage = new Storage({
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'sportsapp-media';
const bucket = storage.bucket(bucketName);

export interface UploadedFile {
  url: string;
  filename: string;
}

export async function uploadToGCS(file: Express.Multer.File): Promise<UploadedFile> {
  const filename = `${Date.now()}-${path.basename(file.originalname)}`;
  const blob = bucket.file(filename);
  
  // Create a write stream to upload the file
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (error) => reject(error));
    
    blobStream.on('finish', async () => {
      // Make the file public
      await blob.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
      
      resolve({
        url: publicUrl,
        filename: filename,
      });
    });

    blobStream.end(file.buffer);
  });
}

export async function deleteFromGCS(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete();
  } catch (error) {
    console.error('Error deleting file from GCS:', error);
    throw error;
  }
}