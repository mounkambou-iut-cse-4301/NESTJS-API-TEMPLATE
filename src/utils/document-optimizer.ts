import * as sharp from 'sharp';

const MAX_SIZE = 500 * 1024; // 500KB

/**
 * Vérifie/optimise un document en base64 pour ne pas dépasser 500KB.
 * - URL => renvoyée telle quelle
 * - image => compression/redimensionnement
 * - pdf/autre => accepté seulement si <= 500KB, sinon erreur
 */
export async function optimizeDocument(base64OrUrl: string): Promise<string> {
  if (!base64OrUrl) {
    throw new Error('Document vide.');
  }

  // URL distante déjà fournie
  if (!base64OrUrl.startsWith('data:')) {
    return base64OrUrl;
  }

  const matches = base64OrUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Format base64 invalide.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Déjà conforme
  if (buffer.length <= MAX_SIZE) {
    return base64OrUrl;
  }

  // Images => on compresse
  if (mimeType.startsWith('image/')) {
    try {
      let quality = 85;
      let optimizedBuffer: Buffer = buffer;
      let optimizedSize = buffer.length;

      while (optimizedSize > MAX_SIZE && quality >= 30) {
        optimizedBuffer = await sharp(buffer)
          .rotate()
          .jpeg({ quality, progressive: true })
          .toBuffer();

        optimizedSize = optimizedBuffer.length;
        quality -= 10;
      }

      if (optimizedSize > MAX_SIZE) {
        const metadata = await sharp(buffer).metadata();
        const baseWidth = metadata.width || 1600;

        let width = baseWidth;
        while (optimizedSize > MAX_SIZE && width > 400) {
          width = Math.floor(width * 0.85);

          optimizedBuffer = await sharp(buffer)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .jpeg({ quality: 70, progressive: true })
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
      throw new Error(
        `Impossible d’optimiser l’image à 500KB max. ${
          error instanceof Error ? error.message : ''
        }`,
      );
    }
  }

  // PDF/autres docs => refus si > 500KB
  throw new Error(
    `Le document de type ${mimeType} dépasse 500KB. Merci de le compresser avant l’envoi.`,
  );
}