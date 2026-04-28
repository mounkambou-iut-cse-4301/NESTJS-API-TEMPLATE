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

  // Si c'est déjà une URL, la retourner directement
  if (data.startsWith('http://') || data.startsWith('https://')) {
    return data;
  }

  const isPdf = data.startsWith('data:application/pdf');
  const isSupported = /^data:(image\/.+|application\/pdf);base64,/.test(data);

  if (!isSupported) {
    throw new Error('Format de fichier non supporté. Utilise une image ou un PDF en base64.');
  }

  try {
    // Extraire les données base64 pures
    const base64Data = data.split(',')[1];
    
    // Créer un buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Convertir buffer en base64 URI que Cloudinary accepte
    const base64Uri = `data:${isPdf ? 'application/pdf' : 'image/jpeg'};base64,${buffer.toString('base64')}`;
    
    const result = await cloudinary.uploader.upload(base64Uri, {
      folder,
      resource_type: isPdf ? 'raw' : 'image',
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw new Error(`Échec de l'upload: ${error.message}`);
  }
};