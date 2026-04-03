const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('❌ Cloudinary Ping Failed:', error);
    } else {
        console.log('✅ Cloudinary Ping Successful:', result);
    }
    process.exit(error ? 1 : 0);
});
