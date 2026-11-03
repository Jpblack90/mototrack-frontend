/**
 * Utilidades para procesamiento y compresión de imágenes en el navegador.
 */

/**
 * Reduce una imagen utilizando HTML5 Canvas.
 * - Lado mayor escalado a máximo 1280 px manteniendo la relación de aspecto.
 * - Compresión a JPEG con calidad 0.8.
 *
 * @param {File|Blob} file Archivo de imagen original
 * @returns {Promise<{ base64: string, mimeType: string, originalBytes: number, compressedBytes: number }>}
 */
export async function compressImage(file) {
  const originalBytes = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Error al decodificar la imagen.'));

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const MAX_DIMENSION = 1280;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('No se pudo inicializar el contexto 2D del canvas.'));
        }

        // Fondo blanco para evitar fondos negros en imágenes PNG transparentes convertidas a JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.8);
        const base64 = dataUrl.split(',')[1];
        const compressedBytes = Math.round((base64.length * 3) / 4);

        resolve({
          base64,
          mimeType,
          originalBytes,
          compressedBytes,
        });
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
