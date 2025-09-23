#!/usr/bin/env node

/**
 * Simple test for Cloudinary configuration
 */

require('dotenv').config({ path: '.env' });

console.log('🧪 Testing Cloudinary Configuration...\n');

// Check environment variables
console.log('🔧 Environment Variables:');
console.log(`   CLOUDINARY_URL: ${process.env.CLOUDINARY_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`   CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set'}`);
console.log(`   CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(`   CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set'}\n`);

if (process.env.CLOUDINARY_URL) {
  console.log('📍 CLOUDINARY_URL Details:');
  const url = process.env.CLOUDINARY_URL;
  
  try {
    // Parse the URL to extract components
    const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
    if (match) {
      const [, apiKey, apiSecret, cloudName] = match;
      console.log(`   Cloud Name: ${cloudName}`);
      console.log(`   API Key: ${apiKey}`);
      console.log(`   API Secret: ${'*'.repeat(apiSecret.length)}`);
      console.log('   ✅ URL format is correct');
    } else {
      console.log('   ❌ URL format is incorrect');
    }
  } catch (error) {
    console.log('   ❌ Error parsing URL:', error.message);
  }
} else {
  console.log('❌ CLOUDINARY_URL is not set');
}

console.log('\n🚀 Configuration Status:');
if (process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
  console.log('✅ Cloudinary is properly configured!');
  console.log('✅ Logo upload will use cloud storage');
  console.log('✅ Ready to test in the admin panel');
} else {
  console.log('⚠️  Cloudinary is not configured');
  console.log('💾 Logo upload will use local storage');
  console.log('💡 Add CLOUDINARY_URL to .env for cloud storage');
}

console.log('\n📋 Next Steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. Go to: http://localhost:3000/admin/settings');
console.log('3. Test logo upload in the "شعار الشركة" section');
console.log('4. Check if upload goes to Cloudinary or local storage');
