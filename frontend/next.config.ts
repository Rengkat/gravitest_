import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["jspdf"],
  images: {
    // Question/passage/option images and library content are served
    // from Cloudflare R2 (see backend src/config/storageConfig.ts).
    // Both default R2 URL shapes are allowed here; if the deployment
    // sets R2_PUBLIC_BASE_URL to a custom domain, add that hostname too
    // or next/image will 400 on it in production.
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
