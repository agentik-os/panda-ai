/**
 * Marketplace Uploader
 * Uploads packages to the Agentik OS marketplace
 */

import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import FormData from "form-data";
import archiver from "archiver";
import os from "os";

export interface UploadResult {
  packageId: string;
  version: string;
  downloadUrl: string;
}

/**
 * Upload a package to the marketplace
 */
export async function uploadToMarketplace(
  packagePath: string,
  type: "agent" | "skill",
  metadata: any
): Promise<UploadResult> {
  // 1. Create temporary archive
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agentik-"));
  const archivePath = path.join(
    tempDir,
    `${metadata.name}-${metadata.version}.tar.gz`
  );

  await createArchive(packagePath, archivePath);

  try {
    // 2. Upload to marketplace API
    const formData = new FormData();
    formData.append("type", type);
    formData.append("metadata", JSON.stringify(metadata));
    formData.append("package", createReadStream(archivePath));

    const marketplaceUrl =
      process.env.AGENTIK_MARKETPLACE_URL || "https://api.agentik-os.com/marketplace";

    const response = await fetch(`${marketplaceUrl}/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = (await response.json()) as {
      packageId: string;
      downloadUrl: string;
    };

    return {
      packageId: result.packageId,
      version: metadata.version,
      downloadUrl: result.downloadUrl,
    };
  } finally {
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * Create a tarball archive of the package
 */
async function createArchive(
  sourceDir: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = require("fs").createWriteStream(outputPath);
    const archive = archiver("tar", {
      gzip: true,
      gzipOptions: { level: 9 },
    });

    output.on("close", () => resolve());
    archive.on("error", (err: Error) => reject(err));

    archive.pipe(output);

    // Add files, excluding common directories
    archive.glob(
      "**/*",
      {
        cwd: sourceDir,
        ignore: [
          "node_modules/**",
          ".git/**",
          "dist/**",
          ".next/**",
          "**/*.log",
          ".DS_Store",
          "*.tmp",
        ],
      },
      {}
    );

    archive.finalize();
  });
}

/**
 * Get authentication token from config
 */
function getAuthToken(): string {
  // TODO: Implement actual token retrieval from config
  // For now, check environment variable
  const token = process.env.AGENTIK_AUTH_TOKEN;

  if (!token) {
    throw new Error(
      "No authentication token found. Run 'panda login' first or set AGENTIK_AUTH_TOKEN"
    );
  }

  return token;
}
