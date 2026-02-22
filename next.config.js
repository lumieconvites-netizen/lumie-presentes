/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      // UploadThing geralmente entrega por aqui
      { protocol: "https", hostname: "utfs.io" },

      // ✅ Supabase Storage (resolve o 400 do /_next/image)
      { protocol: "https", hostname: "*.supabase.co" },
      // opcional (algumas regiões/rotas podem usar .supabase.in)
      { protocol: "https", hostname: "*.supabase.in" },
      // Cloudflare R2 public URLs
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },

  webpack: (config, { dev }) => {
    // ✅ Esse ignore é útil no Windows DEV, mas não faz sentido na Vercel (Linux/prod).
    if (dev && process.platform === "win32") {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored)
            ? config.watchOptions.ignored
            : []),
          "**/.git/**",
          "**/node_modules/**",
          "C:\\\\hiberfil.sys",
          "C:\\\\pagefile.sys",
          "C:\\\\swapfile.sys",
          "C:\\\\DumpStack.log.tmp",
        ],
      };
    }

    return config;
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  hideSourceMaps: true,
});
