import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 親ディレクトリに別の package-lock.json が存在し、ワークスペースルートが
  // 誤検出されるのを防ぐため、このプロジェクトをトレースルートに固定する。
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // 書類アップロード（Server Action）のボディ上限。重いファイルはDrive URL運用。
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
