import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";


const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "templates",
        resource_type: "raw", 
        
        use_filename: true,
        unique_filename: true, 
        public_id: originalName, 
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const uploadAvatarToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",        
        resource_type: "image",     
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); 
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error("Lỗi xóa file Cloudinary:", error);
  }
};

export default {
  uploadToCloudinary,
  uploadAvatarToCloudinary,
  deleteFromCloudinary
};