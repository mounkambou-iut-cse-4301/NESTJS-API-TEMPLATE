import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';
import sharp from 'sharp';
import { Readable } from 'stream';
import { optimizeDocument } from './document-optimizer';

const MAX_SIZE = 500 * 1024; // 500KB

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function optimizeImageBuffer(buffer: Buffer): Promise<Buffer> {
  if (buffer.length <= MAX_SIZE) {
    return buffer;
  }

  let quality = 85;
  let optimizedBuffer = buffer;
  let optimizedSize = buffer.length;

  while (optimizedSize > MAX_SIZE && quality >= 30) {
    optimizedBuffer = await sharp(buffer)
      .rotate()
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      })
      .toBuffer();

    optimizedSize = optimizedBuffer.length;
    quality -= 10;
  }

  if (optimizedSize > MAX_SIZE) {
    const metadata = await sharp(buffer).metadata();
    let width = metadata.width || 1600;

    while (optimizedSize > MAX_SIZE && width > 400) {
      width = Math.floor(width * 0.85);

      optimizedBuffer = await sharp(buffer)
        .rotate()
        .resize({
          width,
          withoutEnlargement: true,
        })
        .jpeg({
          quality: 70,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      optimizedSize = optimizedBuffer.length;
    }
  }

  if (optimizedSize > MAX_SIZE) {
    throw new Error(
      `Image trop lourde après optimisation (${optimizedSize} bytes).`,
    );
  }

  return optimizedBuffer;
}

async function uploadBufferToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'raw',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result?.secure_url) {
          return reject(new Error('Cloudinary n’a pas retourné d’URL.'));
        }

        resolve(result.secure_url);
      },
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
}

/**
 * Compatible avec :
 * - URL HTTP/HTTPS
 * - base64 data URI
 * - fichier multipart/form-data via Multer
 */
export const uploadImageToCloudinary = async (
  data: string | Express.Multer.File,
  folder: string,
): Promise<string> => {
  if (!data) {
    throw new Error('Fichier vide.');
  }

  if (typeof data !== 'string') {
    const file = data;

    if (!file.buffer) {
      throw new Error('Fichier multipart invalide.');
    }

    const mimeType = file.mimetype;

    if (mimeType.startsWith('image/')) {
      const optimizedBuffer = await optimizeImageBuffer(file.buffer);
      return uploadBufferToCloudinary(optimizedBuffer, folder, 'image');
    }

    if (mimeType === 'application/pdf') {
      if (file.buffer.length > MAX_SIZE) {
        throw new Error(
          'Le PDF dépasse 500KB. Merci de le compresser avant l’envoi.',
        );
      }

      return uploadBufferToCloudinary(file.buffer, folder, 'raw');
    }

    throw new Error('Format de fichier non supporté.');
  }

  if (data.startsWith('http://') || data.startsWith('https://')) {
    return data;
  }

  const optimizedData = await optimizeDocument(data);

  const isPdf = optimizedData.startsWith('data:application/pdf');
  const isSupported = /^data:(image\/.+|application\/pdf);base64,/.test(
    optimizedData,
  );

  if (!isSupported) {
    throw new Error(
      'Format de fichier non supporté. Utilise une image ou un PDF en base64.',
    );
  }

  const result = await cloudinary.uploader.upload(optimizedData, {
    folder,
    resource_type: isPdf ? 'raw' : 'image',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  return result.secure_url;
};