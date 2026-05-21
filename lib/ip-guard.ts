const DEFAULT_BLOCKED_IPS = [
  "187.44.236.188",
];

const BLOCKED_IP_KEY_PREFIX = "lumie:blocked-ip:";
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

function readRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  return { url, token };
}

function blockedIpKey(ip: string) {
  return `${BLOCKED_IP_KEY_PREFIX}${ip}`;
}

async function redisCommand<T = any>(command: unknown[]) {
  const { url, token } = readRedisConfig();
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as { result?: T } | null;
}

export async function isBlockedIpAsync(ip?: string | null) {
  const value = String(ip ?? "").trim();
  if (!value || value === "unknown") return false;
  if (isBlockedIp(value)) return true;

  const payload = await redisCommand<string | null>(["GET", blockedIpKey(value)]);
  return Boolean(payload?.result);
}

export async function blockIpPermanently(ip?: string | null) {
  const value = String(ip ?? "").trim();
  if (!value || value === "unknown") return false;

  await redisCommand(["SET", blockedIpKey(value), "1"]);
  return true;
}

export function getBlockedIpMessage() {
  return "Muitas tentativas suspeitas foram detectadas neste acesso. Aguarde e tente novamente mais tarde.";
}
