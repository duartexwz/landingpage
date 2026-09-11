// ============================================================
// Config da landing — TROQUE AQUI seu número de WhatsApp
// Formato: DDI + DDD + número, só dígitos (ex: '5511987654321')
// ============================================================
export const WHATSAPP_NUMBER = '5561984092729';

export const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

// Normaliza telefone do cliente para wa.me: só dígitos + DDI 55 se ausente.
export const normalizarTelefone = (fone) => {
  const dig = String(fone || '').replace(/\D/g, '');
  if (!dig) return '';
  if (dig.startsWith('55') && dig.length >= 12) return dig;
  if ((dig.length === 10 || dig.length === 11) && !dig.startsWith('55')) return `55${dig}`;
  return dig;
};

export const waCliente = (telefone, text) => {
  const numero = normalizarTelefone(telefone);
  if (!numero) return '';
  return `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
};
