const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'placeholder_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder_secret'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mall_offers',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Optimize for storage/speed
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { cloudinary, upload };
