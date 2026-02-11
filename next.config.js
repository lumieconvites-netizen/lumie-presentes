/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      // se você usa UploadThing de verdade, normalmente o host das imagens é utfs.io
      { protocol: 'https', hostname: 'utfs.io' },
    ],
  },

  webpack: (config, { dev }) => {
    // ✅ Esse ignore é útil no Windows DEV, mas não faz sentido na Vercel (Linux/prod).
    if (dev && process.platform === 'win32') {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
          '**/.git/**',
          '**/node_modules/**',
          'C:\\\\hiberfil.sys',
          'C:\\\\pagefile.sys',
          'C:\\\\swapfile.sys',
          'C:\\\\DumpStack.log.tmp',
        ],
      };
    }

    return config;
  },
};

module.exports = nextConfig;
