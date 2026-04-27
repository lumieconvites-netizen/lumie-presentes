import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const CLIENT_DIR = path.join(PROJECT_ROOT, "public", "tutorial-cliente");
const PARTNER_DIR = path.join(PROJECT_ROOT, "public", "tutorial-parceiro");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "lib", "tutorial-videos.ts");

function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim().replace(/^"(.*)"$/, "$1");
    result[key] = value;
  }
  return result;
}

async function loadEnvFromLocalFiles() {
  const files = [".env.production.local", ".env.local"];
  for (const file of files) {
    const full = path.join(PROJECT_ROOT, file);
    try {
      const content = await fs.readFile(full, "utf8");
      const parsed = parseEnvFile(content);
      for (const [key, value] of Object.entries(parsed)) {
        if (!process.env[key] && value) process.env[key] = value;
      }
    } catch {
      // ignore
    }
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
}

function slugifyBaseName(input) {
  return String(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toConstId(input) {
  return input
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getContentTypeByExtension(ext) {
  const normalized = ext.toLowerCase();
  if (normalized === ".mp4") return "video/mp4";
  if (normalized === ".mov") return "video/quicktime";
  if (normalized === ".webm") return "video/webm";
  return "application/octet-stream";
}

async function listVideoFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => [".mp4", ".mov", ".webm"].includes(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" }));
}

async function uploadGroup({ client, bucket, publicBaseUrl, dir, groupKey }) {
  const files = await listVideoFiles(dir);
  const uploaded = [];

  for (const fileName of files) {
    const fullPath = path.join(dir, fileName);
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(fileName).toLowerCase();
    const baseName = path.basename(fileName, ext);
    const key = `tutorials/${groupKey}/${slugifyBaseName(baseName)}${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: getContentTypeByExtension(ext),
      })
    );

    uploaded.push({
      id: `${groupKey}_${toConstId(slugifyBaseName(baseName))}`,
      title: baseName,
      url: `${publicBaseUrl}/${key}`,
    });

    console.log(`[R2] OK: ${groupKey} -> ${fileName}`);
  }

  return uploaded;
}

function buildOutputTs(clientVideos, partnerVideos) {
  const makeSection = (name, items) => {
    const lines = items.map(
      (item) =>
        `  { id: ${JSON.stringify(item.id)}, title: ${JSON.stringify(item.title)}, url: ${JSON.stringify(item.url)} },`
    );
    return `export const ${name}: TutorialVideo[] = [\n${lines.join("\n")}\n];`;
  };

  return `export type TutorialVideo = {
  id: string;
  title: string;
  url: string;
};

${makeSection("CLIENT_TUTORIAL_VIDEOS", clientVideos)}

${makeSection("PARTNER_TUTORIAL_VIDEOS", partnerVideos)}
`;
}

async function run() {
  await loadEnvFromLocalFiles();

  const accountId = getRequiredEnv("CLOUDFLARE_R2_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const bucket = getRequiredEnv("CLOUDFLARE_R2_BUCKET");
  const publicBaseUrl = getRequiredEnv("CLOUDFLARE_R2_PUBLIC_BASE_URL").replace(/\/+$/, "");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const clientVideos = await uploadGroup({
    client,
    bucket,
    publicBaseUrl,
    dir: CLIENT_DIR,
    groupKey: "cliente",
  });

  const partnerVideos = await uploadGroup({
    client,
    bucket,
    publicBaseUrl,
    dir: PARTNER_DIR,
    groupKey: "parceiro",
  });

  const outputContent = buildOutputTs(clientVideos, partnerVideos);
  await fs.writeFile(OUTPUT_FILE, outputContent, "utf8");
  console.log(`\nArquivo gerado: ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);
  console.log(`Cliente: ${clientVideos.length} video(s) | Parceiro: ${partnerVideos.length} video(s)`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
