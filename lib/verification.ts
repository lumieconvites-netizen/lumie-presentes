export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationExpiry(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
