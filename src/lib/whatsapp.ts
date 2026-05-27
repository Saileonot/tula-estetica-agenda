// Construye una URL de WhatsApp evitando api.whatsapp.com,
// que algunos navegadores/extensiones bloquean (ERR_BLOCKED_BY_RESPONSE).
// - Escritorio → web.whatsapp.com/send
// - Móvil      → esquema whatsapp:// (abre la app directamente)
export function buildWhatsappUrl(phone: string, text: string): string {
  const encoded = encodeURIComponent(text);
  const num = phone.replace(/\D/g, "");
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return isMobile
    ? `whatsapp://send?phone=${num}&text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${num}&text=${encoded}`;
}

export function openWhatsapp(phone: string, text: string) {
  const url = buildWhatsappUrl(phone, text);
  window.open(url, "_blank", "noopener,noreferrer");
}
