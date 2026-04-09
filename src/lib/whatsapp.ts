export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9+]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}
