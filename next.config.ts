import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Next.js defaults Server Action request bodies to 1MB, but this app
    // uploads media (images up to 5MB, social videos up to 50MB, see
    // engines/social/media.ts and engines/marketplace/media.ts) directly
    // through Server Actions via FormData. Without this, any upload over
    // 1MB fails with an unhandled 413 ("Body exceeded 1 MB limit") instead
    // of the action's own validation error.
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
};

export default nextConfig;
