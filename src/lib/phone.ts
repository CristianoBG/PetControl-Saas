/**
 * Normaliza um número de telefone para o formato E.164 (+5511999999999).
 * Focado no padrão brasileiro (+55).
 */
export function normalizePhone(phone: string): string {
  // Remove tudo que não for dígito
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // Se já começar com 55 e tiver 12 ou 13 dígitos, assume que já está com DDI
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }

  // Se tiver 10 ou 11 dígitos, assume que é BR sem o 55
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // Caso padrão: apenas retorna com o + na frente se não se encaixar nos anteriores
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Formata um telefone E.164 para exibição amigável (+55 11 99999-9999)
 */
export function formatPhoneForDisplay(phone: string | null): string {
  if (!phone) return '';
  
  // Limpa para garantir (remove o + e outros)
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    const firstPart = digits.substring(4, 9);
    const secondPart = digits.substring(9);
    return `+55 ${ddd} ${firstPart}-${secondPart}`;
  }

  if (digits.length === 12 && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    const firstPart = digits.substring(4, 8);
    const secondPart = digits.substring(8);
    return `+55 ${ddd} ${firstPart}-${secondPart}`;
  }

  return phone;
}
