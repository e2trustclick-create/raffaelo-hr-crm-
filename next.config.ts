import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '127.0.0.1:3000',
        '192.168.1.47:3000',
        'raffaelo-hr-crm-kwva.vercel.app',
        '*.vercel.app',
      ],
    },
  },
};

export default nextConfig;
