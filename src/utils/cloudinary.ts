import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload une image ou un PDF encodé en base64.
 * - Si c'est déjà une URL HTTP/HTTPS, on la garde telle quelle.
 * - Image => resource_type: image
 * - PDF => resource_type: raw
 */
export const uploadImageToCloudinary = async (
  data: string,
  folder: string,
): Promise<string> => {
  if (!data) {
    throw new Error('Fichier vide.');
  }

  if (data.startsWith('http://') || data.startsWith('https://')) {
    return data;
  }

  const isPdf = data.startsWith('data:application/pdf');
  const isSupported = /^data:(image\/.+|application\/pdf);base64,/.test(data);

  if (!isSupported) {
    throw new Error('Format de fichier non supporté. Utilise une image ou un PDF en base64.');
  }

  const result = await cloudinary.uploader.upload(data, {
    folder,
    resource_type: isPdf ? 'raw' : 'image',
  });

  return result.secure_url;
};