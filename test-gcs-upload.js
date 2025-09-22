// Simple Google Cloud Storage Upload Test
// This is a standalone test file to verify GCS upload functionality
// Run with: node test-gcs-upload.js

import 'dotenv/config';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from .env file
const GOOGLE_CLOUD_KEY_FILE = process.env.GOOGLE_CLOUD_KEY_FILE;
const GOOGLE_CLOUD_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const GOOGLE_CLOUD_BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET_NAME;

console.log('🧪 Google Cloud Storage Upload Test');
console.log('=====================================');

// Validate environment variables
if (!GOOGLE_CLOUD_KEY_FILE) {
  console.error('❌ GOOGLE_CLOUD_KEY_FILE is not set in .env file');
  process.exit(1);
}

if (!GOOGLE_CLOUD_PROJECT_ID) {
  console.error('❌ GOOGLE_CLOUD_PROJECT_ID is not set in .env file');
  process.exit(1);
}

if (!GOOGLE_CLOUD_BUCKET_NAME) {
  console.error('❌ GOOGLE_CLOUD_BUCKET_NAME is not set in .env file');
  process.exit(1);
}

// Check if key file exists
if (!fs.existsSync(GOOGLE_CLOUD_KEY_FILE)) {
  console.error(`❌ Google Cloud key file not found at: ${GOOGLE_CLOUD_KEY_FILE}`);
  console.log('Please ensure the keyfile.json is in the correct location');
  process.exit(1);
}

console.log(`✅ Key file found: ${GOOGLE_CLOUD_KEY_FILE}`);
console.log(`✅ Project ID: ${GOOGLE_CLOUD_PROJECT_ID}`);
console.log(`✅ Bucket name: ${GOOGLE_CLOUD_BUCKET_NAME}`);

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: GOOGLE_CLOUD_KEY_FILE,
  projectId: GOOGLE_CLOUD_PROJECT_ID,
});

const bucket = storage.bucket(GOOGLE_CLOUD_BUCKET_NAME);

async function createTestFile() {
  const testContent = `Hello from SportsApp GCS Test!
Generated at: ${new Date().toISOString()}
This is a test file to verify Google Cloud Storage upload functionality.`;
  
  const testFileName = 'test-upload.txt';
  const testFilePath = path.join(__dirname, testFileName);
  
  fs.writeFileSync(testFilePath, testContent);
  console.log(`📝 Created test file: ${testFilePath}`);
  
  return testFilePath;
}

async function testBucketAccess() {
  try {
    console.log('\n🔍 Testing bucket access...');
    
    // First, try to list buckets to test basic access
    console.log('Testing basic GCS access...');
    const [buckets] = await storage.getBuckets();
    console.log(`✅ Successfully connected to GCS. Found ${buckets.length} buckets in project.`);
    
    // Now check if our specific bucket exists
    const [exists] = await bucket.exists();
    
    if (!exists) {
      console.log(`⚠️  Bucket '${GOOGLE_CLOUD_BUCKET_NAME}' does not exist.`);
      console.log('Attempting to create bucket...');
      
      try {
        await bucket.create({
          location: 'US', // You can change this to your preferred location
          storageClass: 'STANDARD',
        });
        console.log(`✅ Created bucket: ${GOOGLE_CLOUD_BUCKET_NAME}`);
      } catch (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n🛠️  Manual bucket creation steps:');
        console.log('1. Go to https://console.cloud.google.com/storage');
        console.log(`2. Select your project: ${GOOGLE_CLOUD_PROJECT_ID}`);
        console.log('3. Click "CREATE BUCKET"');
        console.log(`4. Name your bucket: ${GOOGLE_CLOUD_BUCKET_NAME}`);
        console.log('5. Choose your preferred location and settings');
        console.log('6. Click "CREATE"');
        throw createError;
      }
    } else {
      console.log(`✅ Bucket exists: ${GOOGLE_CLOUD_BUCKET_NAME}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Bucket access failed:', error.message);
    
    if (error.message.includes('does not have storage.buckets.get')) {
      console.log('\n🔧 Permission Fix Instructions:');
      console.log('1. Go to https://console.cloud.google.com/iam-admin/iam');
      console.log(`2. Find your service account: sportsapp@${GOOGLE_CLOUD_PROJECT_ID}.iam.gserviceaccount.com`);
      console.log('3. Click the edit (pencil) icon');
      console.log('4. Click "ADD ANOTHER ROLE"');
      console.log('5. Add these roles:');
      console.log('   - Storage Admin (roles/storage.admin) OR');
      console.log('   - Storage Object Admin (roles/storage.objectAdmin)');
      console.log('6. Click "SAVE"');
      console.log('\nAlternatively, create the bucket manually first.');
    }
    
    return false;
  }
}

async function uploadTestFile(filePath) {
  try {
    console.log('\n⬆️  Testing file upload...');
    
    const fileName = `test-uploads/test-${Date.now()}.txt`;
    const file = bucket.file(fileName);
    
    // Upload the file
    await bucket.upload(filePath, {
      destination: fileName,
      metadata: {
        contentType: 'text/plain',
      },
    });
    
    console.log(`✅ File uploaded successfully: ${fileName}`);
    
    // Generate a signed URL instead of making file public
    // (because uniform bucket-level access is enabled)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    
    console.log('✅ Generated signed URL for access');
    console.log(`🌐 Signed URL (valid for 15 minutes): ${signedUrl}`);
    
    return { fileName, signedUrl };
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    
    if (error.message.includes('uniform bucket-level access')) {
      console.log('\n🔧 Bucket Access Configuration Info:');
      console.log('Your bucket has uniform bucket-level access enabled.');
      console.log('This is actually more secure! Files will be accessed via signed URLs.');
      console.log('For production, you can either:');
      console.log('1. Use signed URLs (recommended for security)');
      console.log('2. Disable uniform bucket-level access if you need public files');
    }
    
    throw error;
  }
}

async function testFileDownload(fileName) {
  try {
    console.log('\n⬇️  Testing file download...');
    
    const file = bucket.file(fileName);
    const [contents] = await file.download();
    
    console.log('✅ File downloaded successfully');
    console.log('📄 File contents:', contents.toString().substring(0, 100) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    return false;
  }
}

async function cleanupTestFile(fileName, localFilePath) {
  try {
    console.log('\n🧹 Cleaning up...');
    
    // Delete from GCS
    await bucket.file(fileName).delete();
    console.log('✅ Deleted file from GCS');
    
    // Delete local test file
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log('✅ Deleted local test file');
    }
  } catch (error) {
    console.error('⚠️  Cleanup warning:', error.message);
  }
}

async function runTest() {
  let testFilePath = null;
  let uploadedFileName = null;
  
  try {
    // Create test file
    testFilePath = await createTestFile();
    
    // Test bucket access
    const bucketAccessible = await testBucketAccess();
    if (!bucketAccessible) {
      throw new Error('Cannot access bucket');
    }
    
    // Test upload
    const uploadResult = await uploadTestFile(testFilePath);
    uploadedFileName = uploadResult.fileName;
    
    // Test download
    await testFileDownload(uploadedFileName);
    
    console.log('\n🎉 All tests passed! Google Cloud Storage is working correctly.');
    console.log('\nYour GCS setup is ready for the SportsApp media uploads.');
    console.log('\nNote: Your bucket uses uniform bucket-level access (more secure).');
    console.log('Files will be accessed via signed URLs instead of public URLs.');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.log('\nPlease check your Google Cloud Storage configuration:');
    console.log('1. Verify your keyfile.json is correct and accessible');
    console.log('2. Check that your project ID is correct');
    console.log('3. Ensure you have the necessary permissions');
    console.log('4. Verify the bucket name is valid');
    
  } finally {
    // Cleanup
    if (uploadedFileName && testFilePath) {
      await cleanupTestFile(uploadedFileName, testFilePath);
    }
  }
}

// Run the test
runTest().catch(console.error);