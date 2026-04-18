import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  async redirects() {
    return [{ source: "/creator/dashboard", destination: "/creator", permanent: false }];
  }
};

export default nextConfig;
