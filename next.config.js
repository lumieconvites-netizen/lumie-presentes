/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'uploadthing.com' },
    ],
  },

  webpack: (config) => {
    // Evita o Watchpack tentar ler arquivos protegidos do Windows (hiberfil/pagefile/etc)
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

    return config;
  },
};

module.exports = nextConfig;
