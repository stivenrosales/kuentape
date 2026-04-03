import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer and its dependencies are ESM-only packages.
  // They run server-side (API routes) so we mark them as external to avoid
  // bundling issues, letting Node.js resolve them natively via ESM.
  serverExternalPackages: ["@react-pdf/renderer", "@react-pdf/font"],
};

export default nextConfig;
