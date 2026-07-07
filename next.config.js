/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
    instrumentationHook: true,
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

module.exports = nextConfig;
