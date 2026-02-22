import { NextResponse } from "next/server";
import { getActingUserContext } from "@/lib/acting-user";
import { isR2Configured, uploadImageToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getFileExt(filename?: string) {
  if (!filename) return "png";
  const parts = filename.split(".");
  const ext = parts[parts.length - 1]?.toLowerCase();
  if (!ext || ext.length > 10) return "png";
  return ext;
}

export async function POST(req: Request) {
  try {
    const ctx = await getActingUserContext();
    const userId = ctx?.effectiveUserId;
    if (!userId) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "uploads";

    if (!file) return NextResponse.json({ error: "Arquivo nao enviado. Use o campo 'file'." }, { status: 400 });
    if (!file.type?.startsWith("image/")) return NextResponse.json({ error: "Envie uma imagem (image/*)." }, { status: 400 });

    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) return NextResponse.json({ error: "Imagem muito grande (max 5MB)." }, { status: 400 });

    const ext = getFileExt(file.name);
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error: "Upload indisponivel: Cloudflare R2 nao configurado.",
        },
        { status: 503 }
      );
    }

    const url = await uploadImageToR2({
      key: path,
      body: buffer,
      contentType: file.type,
    });
    return NextResponse.json({ url }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Erro inesperado" }, { status: 500 });
  }
}
