/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sgp1.digitaloceanspaces.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
