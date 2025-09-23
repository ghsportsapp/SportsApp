// Test script for media upload API endpoint
// Run this after starting the server with npm run dev

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMediaUpload() {
  console.log('🧪 Testing Media Upload API Endpoint');
  console.log('====================================');

  // Create a test image file
  const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/hLCHeAAAAABJRU5ErkJggg==', 'base64');
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  fs.writeFileSync(testImagePath, testImageContent);
  console.log('✅ Created test image file');

  try {
    // Test with undici's fetch and FormData (more compatible)
    const { FormData } = await import('undici');
    const form = new FormData();
    
    // Add the test file
    const fileBuffer = fs.readFileSync(testImagePath);
    const file = new Blob([fileBuffer], { type: 'image/png' });
    form.append('files', file, 'test-image.png');

    console.log('⬆️  Testing upload to /api/media/upload...');
    
    const response = await fetch('http://localhost:3000/api/media/upload', {
      method: 'POST',
      body: form
    });

    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload successful!');
      console.log('Response:', JSON.stringify(result, null, 2));
      
      if (result.files && result.files.length > 0) {
        console.log('📁 Uploaded files:');
        result.files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file.filename}`);
          console.log(`     URL: ${file.url.substring(0, 100)}...`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Upload failed');
      console.log('Error:', errorText);
      
      if (response.status === 401) {
        console.log('💡 Note: You need to be authenticated to upload files');
      } else if (response.status === 500) {
        console.log('💡 Server error - check server logs for details');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running: npm run dev');
    } else {
      console.log('💡 Error details:', error);
    }
  } finally {
    // Cleanup test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Cleaned up test file');
    }
  }
}

// Run the test
testMediaUpload().catch(console.error);