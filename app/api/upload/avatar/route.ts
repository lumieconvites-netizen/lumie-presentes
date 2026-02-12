import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string | null) ?? "uploads";

    if (!file) return NextResponse.json({ error: "Arquivo não enviado. Use o campo 'file'." }, { status: 400 });
    if (!file.type?.startsWith("image/")) return NextResponse.json({ error: "Envie uma imagem (image/*)." }, { status: 400 });

    const MAX = 5 * 1024 * 1024;
    if (file.size > MAX) return NextResponse.json({ error: "Imagem muito grande (máx 5MB)." }, { status: 400 });

    const ext = getFileExt(file.name);
    const path = `${userId}/${folder}/${Date.now()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = "avatars"; // pode usar o mesmo bucket
    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: `Falha no upload: ${uploadError.message}` }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) return NextResponse.json({ error: "Não foi possível gerar URL pública." }, { status: 500 });

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Erro inesperado" }, { status: 500 });
  }
}
