import type { NextConfig } from "next";

const repoName=process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath=process.env.GITHUB_ACTIONS&&repoName?`/${repoName}`:"";
const nextConfig: NextConfig = {output:"export",trailingSlash:true,assetPrefix:basePath};

export default nextConfig;
