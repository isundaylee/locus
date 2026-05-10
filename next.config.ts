import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep DB libs external so they land in standalone node_modules and
  // can also be resolved by the standalone scripts/migrate.mjs runner.
  serverExternalPackages: ["postgres", "drizzle-orm"],
};

export default nextConfig;
