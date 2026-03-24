
/**
 * Utilitários para Formatação e Validação de QR Codes do Sistema CTM
 * Padrão Obrigatório Item: CTM|ITEM|<ITEM_ID>
 * Padrão Opcional Missionário: CTM|MIS|<MIS_ID> (ou aceita ID puro)
 */

const PREFIX = 'CTM';
const TYPE_ITEM = 'ITEM';
const TYPE_MIS = 'MIS';
const SEPARATOR = '|';

export const encodeItemQr = (itemId: string): string => {
  if (!itemId) return '';
  return `${PREFIX}${SEPARATOR}${TYPE_ITEM}${SEPARATOR}${itemId.trim()}`;
};

export const decodeItemQr = (qrText: string): string => {
  if (!qrText) throw new Error("Código vazio.");
  const parts = qrText.split(SEPARATOR);
  
  // Se não tem formato CTM, assume erro ou legado se for estrito
  if (parts.length < 3 || parts[0] !== PREFIX || parts[1] !== TYPE_ITEM) {
     throw new Error("QR Code de ITEM inválido. Use formato CTM.");
  }
  return parts[2].trim();
};

export const decodeMissionaryQr = (qrText: string): string => {
  if (!qrText) return '';
  const parts = qrText.split(SEPARATOR);
  
  // Se for formato CTM|MIS|123
  if (parts.length >= 3 && parts[0] === PREFIX && parts[1] === TYPE_MIS) {
    return parts[2].trim();
  }
  
  // Se for apenas o ID (Crachá antigo ou simples)
  // Aceita qualquer string que não pareça um item
  if (!qrText.startsWith(PREFIX)) {
    return qrText.trim();
  }
  
  throw new Error("Formato de QR desconhecido para Missionário.");
};
