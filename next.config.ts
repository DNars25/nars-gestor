import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Permitir imagens de qualquer domínio para thumbnails do XUI
  images: {
    unoptimized: true,
  },
  // Reduzir logs em produção
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
