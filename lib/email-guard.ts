const BLOCKED_EMAIL_DOMAINS = [
  "bpltv.com",
  "bpl.ovh",
  "dpl.ovh",
  "oky.ovh",
  "sgm.ovh",
  "ukm.ovh",
  "dv2.host",
];

const BLOCKED_EMAIL_TLDS = ["ovh", "host"];

export function getEmailDomain(email: string) {
  return email.trim().toLowerCase().split("@").pop() ?? "";
}

export function isBlockedEmailDomain(email: string) {
  const domain = getEmailDomain(email);
  if (!domain || !domain.includes(".")) return true;

  const tld = domain.split(".").pop() ?? "";
  if (BLOCKED_EMAIL_TLDS.includes(tld)) return true;

  return BLOCKED_EMAIL_DOMAINS.some((blockedDomain) => (
    domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
  ));
}

export function getBlockedEmailMessage() {
  return "Use um email real para criar sua conta. Emails temporarios ou descartaveis nao sao aceitos.";
}
