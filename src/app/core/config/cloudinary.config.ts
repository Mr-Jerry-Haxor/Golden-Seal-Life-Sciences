/**
 * Cloudinary Configuration
 * Golden Seal Life Sciences image hosting via Cloudinary
 */

export const cloudinaryConfig = {
  // Your Cloudinary cloud name (found in Cloudinary dashboard)
  cloudName: 'dvqdwq4wa', // Replace with your cloud name from Cloudinary
  
  // Upload preset created in Cloudinary: "Golden_Seal_Life_Sciences"
  uploadPreset: 'Golden_Seal_Life_Sciences',

  // Optional credentials for permanent delete operations.
  // Prefer performing signed delete from a secure backend if possible.
  apiKey: '',
  apiSecret: '',
  
  // API signing disabled for simplicity (preset handles auth)
  // Set to false since upload presets don't require API key
  requireSignature: false,
  
  // Image upload folder in Cloudinary
  folder: 'golden-seal-life-sciences',
  
  // Allowed image formats
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  
  // Max upload size (bytes) - 50MB
  maxFileSize: 52428800,
  
  // Image transformation defaults
  transformations: {
    // Width for thumbnail previews in admin
    thumbWidth: 300,
    thumbHeight: 188, // 16:10 aspect ratio
    
    // Full-size image for product pages
    displayWidth: 800,
    displayHeight: 500, // 16:10 aspect ratio
    
    // Quality setting (1-100)
    quality: 85
  }
};

export function isCloudinaryConfigured(config: typeof cloudinaryConfig): boolean {
  return config.cloudName !== 'YOUR_CLOUD_NAME' && config.cloudName.trim().length > 0;
}

export function isCloudinaryDeleteConfigured(config: typeof cloudinaryConfig): boolean {
  return config.apiKey.trim().length > 0 && config.apiSecret.trim().length > 0;
}
