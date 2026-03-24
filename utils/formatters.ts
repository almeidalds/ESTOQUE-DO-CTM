
export const formatNumber = (value: number, compact: boolean = false): string => {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('pt-BR', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '-';
  // Assume YYYY-MM-DD or ISO
  const date = new Date(dateStr);
  // Ajuste de fuso horário simples para visualização (evitar d-1)
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(adjustedDate);
};

export const truncateText = (text: string, maxLength: number = 20): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
