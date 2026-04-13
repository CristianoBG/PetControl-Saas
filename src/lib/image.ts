/**
 * image.ts — utilitários de imagem para upload no SaaS.
 *
 * Regra de ouro: NUNCA enviar imagem original ao Storage.
 * Sempre comprimir → reduz custo, elimina erro de limite e acelera upload.
 */

// ─── Tipos ─────────────────────────────────────────────────────────────────────
export interface ImageValidation {
  valid: boolean;
  message?: string;
}

// ─── Constantes ────────────────────────────────────────────────────────────────
const MAX_DIMENSION = 800;  // px (largura ou altura máxima)
const JPEG_QUALITY  = 0.75; // 0–1 — equilíbrio entre qualidade e peso
const MAX_SIZE_MB   = 10;   // limite de entrada — rejeita arquivos absurdos

// ─── validateImage ─────────────────────────────────────────────────────────────
/**
 * Valida o arquivo antes de qualquer processamento.
 * Retorna { valid: true } ou { valid: false, message: '...' }.
 */
export function validateImage(file: File | null | undefined): ImageValidation {
  if (!file) return { valid: false, message: 'Nenhum arquivo selecionado.' };

  if (!file.type.startsWith('image/')) {
    return { valid: false, message: 'O arquivo selecionado não é uma imagem.' };
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    return { valid: false, message: `Imagem muito grande (${sizeMB.toFixed(0)} MB). Máximo: ${MAX_SIZE_MB} MB.` };
  }

  return { valid: true };
}

// ─── compressImage ─────────────────────────────────────────────────────────────
/**
 * Redimensiona e converte para JPEG com qualidade balanceada.
 *
 * - Mantém proporção original
 * - Dimensão máxima: 800 × 800 px
 * - Saída: Blob JPEG ≈ 100–400 KB
 * - Nunca altera o arquivo original
 */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // libera memória imediatamente

      let { width, height } = img;

      // Redimensiona mantendo proporção
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas não disponível neste ambiente.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Falha ao comprimir imagem. Tente outro arquivo.'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };

    img.src = objectUrl;
  });
}

// ─── getImagePreviewUrl ────────────────────────────────────────────────────────
/**
 * Cria URL de preview a partir de File ou Blob (usar para <img src={...} />).
 * Sempre chamar URL.revokeObjectURL() quando o preview não for mais necessário
 * (ex: no cleanup do useEffect ou ao trocar de foto).
 */
export function getImagePreviewUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}
