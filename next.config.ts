import type { NextConfig } from "next";
import { getBuildTimeOpenWeatherKey } from "./lib/openWeatherKey";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = process.env.GITHUB_REPOSITORY_NAME || "sourdough";
const openWeatherKey = getBuildTimeOpenWeatherKey();

/** Static HTML export for GitHub Pages — no Node server at runtime. */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_OPENWEATHER_API_KEY: openWeatherKey,
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? `/${repoName}` : "",
  },
  ...(isGithubPages && {
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
};

export default nextConfig;
