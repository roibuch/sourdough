import type { NextConfig } from "next";
import { getBuildTimeOpenWeatherKey } from "./lib/openWeatherKey";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY_NAME || "sourdough";
const openWeatherKey = getBuildTimeOpenWeatherKey();

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_OPENWEATHER_API_KEY: openWeatherKey,
  },
  ...(isGithubPages && {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
};

export default nextConfig;
