const cloudinary = require('cloudinary').v2;
const CloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder_name',
    api_key: process.env.CLOUDINARY_API_KEY || 'placeholder_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder_secret'
});

const storage = CloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'mall_offers',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
