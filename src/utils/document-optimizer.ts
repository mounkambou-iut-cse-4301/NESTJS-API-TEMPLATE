import sharp from 'sharp';

const MAX_SIZE = 500 * 1024; // 500KB

export async function optimizeDocument(base64OrUrl: string): Promise<string> {
  if (!base64OrUrl) {
    throw new Error('Document vide.');
  }

  if (
    base64OrUrl.startsWith('http://') ||
    base64OrUrl.startsWith('https://')
  ) {
    return base64OrUrl;
  }

  if (!base64OrUrl.startsWith('data:')) {
    throw new Error(
      'Format invalide. Le fichier doit être une URL ou un base64 data URI.',
    );
  }

  const matches = base64OrUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches) {
    throw new Error('Format base64 invalide.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length <= MAX_SIZE) {
    return base64OrUrl;
  }

  if (mimeType.startsWith('image/')) {
    try {
      let quality = 85;
      let optimizedBuffer: Buffer = buffer;
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
          `Image trop lourde après optimisation (${optimizedSize} bytes). Merci d’envoyer une image plus légère.`,
        );
      }

      return `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';

      throw new Error(
        `Impossible d’optimiser l’image à 500KB max. ${message}`,
      );
    }
  }

  throw new Error(
    `Le document de type ${mimeType} dépasse 500KB. Merci de le compresser avant l’envoi.`,
  );
}