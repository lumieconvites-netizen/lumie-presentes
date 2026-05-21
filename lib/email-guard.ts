const BLOCKED_EMAIL_DOMAINS = [
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "bpltv.com",
  "bpl.ovh",
  "dispostable.com",
  "dpl.ovh",
  "oky.ovh",
  "guerrillamail.biz",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamail.net",
  "guerrillamail.org",
  "sgm.ovh",
  "mail.tm",
  "maildrop.cc",
  "mailinator.com",
  "moakt.com",
  "sharklasers.com",
  "tempmail.com",
  "tempmail.net",
  "temp-mail.org",
  "trashmail.com",
  "yopmail.com",
  "ukm.ovh",
  "dv2.host",
  "kanonmail.com",
];

const BLOCKED_EMAIL_TLDS = ["ovh", "host"];

const BLOCKED_DOMAIN_KEYWORDS = [
  "10minute",
  "disposable",
  "guerrilla",
  "tempmail",
  "tmpmail",
  "trashmail",
];

export function getEmailDomain(email: string) {
  return email.trim().toLowerCase().split("@").pop() ?? "";
}

export function isBlockedEmailDomain(email: string) {
  const domain = getEmailDomain(email);
  if (!domain || !domain.includes(".")) return true;

  const tld = domain.split(".").pop() ?? "";
  if (BLOCKED_EMAIL_TLDS.includes(tld)) return true;
  if (BLOCKED_DOMAIN_KEYWORDS.some((keyword) => domain.includes(keyword))) return true;

  return BLOCKED_EMAIL_DOMAINS.some((blockedDomain) => (
    domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
  ));
}

export function getBlockedEmailMessage() {
  return "Use um email real para criar sua conta. Emails temporarios ou descartaveis nao sao aceitos.";
}
