import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hewdanqdxiizxanlqgmg.supabase.co',
      },
    ],
  },
};

export default nextConfig;
