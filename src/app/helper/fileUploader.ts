import multer from 'multer'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import config from '../config'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // step- 1 (path change in current working directory cwd)
    // --  cb(null, '/tmp/my-uploads')
    cb(null, path.join(process.cwd(), "/uploads"))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})


// step-2 
const upload = multer({ storage: storage })

const uploadToCloudinary = async (file: Express.Multer.File, publicId?: string) => {
  // step-3 Configuration
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
  });

  // step-4 Upload an image
  const uploadResult = await cloudinary.uploader
    .upload(
      file.path, {
      public_id: publicId ? publicId : file.filename,
      overwrite: true
    })
    .catch((error) => {
      console.log(error);
    });

  return uploadResult
}

export const fileUploader = {
  upload,
  uploadToCloudinary
}