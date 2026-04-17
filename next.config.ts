import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ✅ NOT "export"
};

export default nextConfig;