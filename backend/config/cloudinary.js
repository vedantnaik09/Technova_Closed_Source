const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Audio storage configuration
const audioStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'meeting-audios',
    resource_type: 'video', // For audio files
    public_id: (req, file) => `${req.params.userId}-${Date.now()}`,
    format: 'webm',
  },
});

// Resume storage configuration
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'resumes',
    resource_type: 'raw', // For PDF files
    public_id: (req, file) => `${req.user.id}-resume`,
    format: 'pdf',
  },
});

module.exports = { cloudinary, audioStorage, resumeStorage };