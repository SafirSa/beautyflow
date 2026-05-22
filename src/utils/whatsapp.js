export function normalizePhoneForWhatsApp(phone) {
  const cleanPhoneNumber = String(phone)
    .replace(/[\s\-()]/g, '')
    .replace(/^\+/, '');

  if (cleanPhoneNumber.startsWith('0')) {
    return `972${cleanPhoneNumber.slice(1)}`;
  }

  return cleanPhoneNumber;
}

export function createWhatsAppLink(phoneNumber, message = '') {
  const cleanPhoneNumber = normalizePhoneForWhatsApp(phoneNumber);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
}
