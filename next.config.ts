import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/logon",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/signin",
        destination: "/login",
        permanent: false,
      },
      {
        source: "/signup",
        destination: "/register",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
