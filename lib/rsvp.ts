import crypto from "crypto";

export function normalizeGuestName(name: string) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function createQrToken() {
  return crypto.randomBytes(18).toString("hex");
}

export function createCheckInCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

export function getQrPayload(token: string, slug: string) {
  return `${getPublicBaseUrl()}/site/${encodeURIComponent(slug)}/confirmar-presenca?token=${encodeURIComponent(token)}`;
}

export function getQrImageUrl(payload: string, size = 280) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}
