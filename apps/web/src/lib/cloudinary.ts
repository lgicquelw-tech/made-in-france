import { v2 as cloudinary } from 'cloudinary';

/**
 * Client Cloudinary côté serveur uniquement.
 *
 * Les trois valeurs viennent de l'environnement du serveur et ne sont jamais
 * exposées au navigateur (aucune n'est préfixée `NEXT_PUBLIC_`).
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/** Types réellement acceptés. L'ancienne route n'en vérifiait aucun. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function uploadImage(
  buffer: Buffer,
  options: { folder: string; transformation: Record<string, unknown>[] }
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...options, resource_type: 'image' },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Upload Cloudinary sans résultat'));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
}
