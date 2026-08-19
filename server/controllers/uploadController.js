import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config is automatically picked up from CLOUDINARY_URL if available,
// or we can manually configure it using the variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// GET /api/uploads/signature
// Generate a signed upload signature for direct-to-cloudinary uploads
export const getUploadSignature = (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // We can define the folder and other params here if needed.
    const paramsToSign = {
      timestamp: timestamp,
      // You can add folder: 'campuslink/events' here if you want to organize uploads in a folder
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
};
