import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@anthropic-ai/sdk"],
}

export default nextConfig
