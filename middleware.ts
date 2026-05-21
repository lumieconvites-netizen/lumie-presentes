import { NextRequest, NextResponse } from "next/server";
import { getBlockedIpMessage, isBlockedIpAsync } from "@/lib/ip-guard";

function getRequestIp(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function blockedResponse(request: NextRequest) {
  const message = getBlockedIpMessage();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return new NextResponse(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Acesso bloqueado | LUMIE</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #faf7f4;
        color: #2f211c;
        font-family: Arial, sans-serif;
      }
      main {
        max-width: 440px;
        padding: 32px;
        text-align: center;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
      }
      p {
        margin: 0;
        color: #6f5d55;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Acesso indisponivel</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`,
    {
      status: 403,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function middleware(request: NextRequest) {
  const ip = getRequestIp(request);
  if (await isBlockedIpAsync(ip)) {
    return blockedResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml).*)"],
};
