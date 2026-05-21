const DEFAULT_BLOCKED_IPS = [
  "187.44.236.188",
];

function readConfiguredBlockedIps() {
  return (process.env.BLOCKED_IPS ?? "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export function isBlockedIp(ip?: string | null) {
  const value = String(ip ?? "").trim();
  if (!value || value === "unknown") return false;

  const blockedIps = new Set([...DEFAULT_BLOCKED_IPS, ...readConfiguredBlockedIps()]);
  return blockedIps.has(value);
}

export function getBlockedIpMessage() {
  return "Muitas tentativas suspeitas foram detectadas neste acesso. Aguarde e tente novamente mais tarde.";
}
