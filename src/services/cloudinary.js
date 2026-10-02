const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

function uploadToCloudinary(buffer, folder = 'hadera/products') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;

  return cloudinary.uploader.destroy(publicId);
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};