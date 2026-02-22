"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  const { error, reset } = props;

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Ocorreu um erro inesperado</h1>
            <p style={{ opacity: 0.8, marginBottom: 20 }}>
              Nossa equipe foi notificada. Tente novamente.
            </p>
            <button
              onClick={() => reset()}
              style={{
                border: "1px solid #d7d7d7",
                borderRadius: 8,
                padding: "10px 16px",
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

