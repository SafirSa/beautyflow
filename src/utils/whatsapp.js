export function createWhatsAppLink(phoneNumber, message = '') {
  const cleanPhoneNumber = String(phoneNumber).replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
}
