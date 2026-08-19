/** @type {import('next').NextConfig} */
import "dotenv/config";

const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
