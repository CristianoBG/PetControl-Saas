/**
 * barcode.ts — utilitário canônico de códigos de barras.
 * Centraliza normalização, validação e formatação.
 * Toda entrada de barcode no sistema deve passar por normalizeBarcode.
 */

// ─── Normalização ──────────────────────────────────────────────────────────────

/**
 * Remove espaços, tabs, quebras de linha e qualquer caractere não-numérico.
 * Garante comparação 100% confiável entre leituras do mesmo scanner
 * (variações GS1, prefixos invisíveis, trailing newlines, etc).
 */
export function normalizeBarcode(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\s/g, '').replace(/[^0-9]/g, '');
}

// ─── Validação ─────────────────────────────────────────────────────────────────

const MIN_DIGITS = 8;  // EAN-8 é o menor padrão comercial
const MAX_DIGITS = 20; // ITF-14 tem 14, margem para códigos internos

/**
 * Retorna null se válido, ou uma string com o motivo do erro.
 * Use isValidBarcode() se só precisar do boolean.
 */
export function validateBarcode(raw: string): string | null {
  const code = normalizeBarcode(raw);

  if (code.length === 0) return 'Código vazio.';
  if (code.length < MIN_DIGITS) return `Código muito curto (mínimo ${MIN_DIGITS} dígitos, lido: ${code.length}).`;
  if (code.length > MAX_DIGITS) return `Código muito longo (máximo ${MAX_DIGITS} dígitos, lido: ${code.length}).`;

  // Rejeita sequências uniformes: 00000000, 11111111, 99999999…
  // São leituras de lixo ou etiquetas de teste.
  if (/^(\d)\1+$/.test(code)) return `Código inválido — sequência uniforme (${code}).`;

  // Rejeita sequências óbvias de placeholder: 12345678, 87654321
  if (code === '12345678' || code === '87654321' || code === '1234567890') {
    return 'Código inválido — parece um placeholder.';
  }

  return null; // válido
}

/** Boolean rápido de validação — use validateBarcode() para mensagem de erro. */
export function isValidBarcode(raw: string): boolean {
  return validateBarcode(raw) === null;
}

// ─── Formatação visual ─────────────────────────────────────────────────────────

/** Exibe em blocos de 4 dígitos para leitura humana: 7891 2345 6789 01 */
export function formatBarcodeDisplay(code: string): string {
  const normalized = normalizeBarcode(code);
  if (!normalized) return '—';
  return normalized.replace(/(.{4})(?=.)/g, '$1 ').trim();
}
