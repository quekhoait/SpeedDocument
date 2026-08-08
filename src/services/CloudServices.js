import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";


const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "templates",
        resource_type: "raw", // Bắt buộc cho file Word (.docx)
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export default {
    uploadToCloudinary,
};