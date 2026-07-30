import { NextRequest, NextResponse } from "next/server";
import { uploadToShelby } from "@/lib/shelby";
import type { UploadResponse } from "@/types/file";

export const runtime = "nodejs";

function safeBlobName(fileName: string): string {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return `vault/${Date.now()}-${normalized || "file"}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const maxBytes =
      Math.max(1, Number(process.env.MAX_FILE_SIZE_MB ?? 10)) * 1024 * 1024;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please choose a valid file." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    }

    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File must be smaller than ${maxBytes / 1024 / 1024} MB.` },
        { status: 413 },
      );
    }

    const provider =
      process.env.UPLOAD_PROVIDER?.toLowerCase() === "shelby"
        ? "shelby"
        : "demo";
    const blobName = safeBlobName(file.name);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const shelbyResult =
      provider === "shelby"
        ? await uploadToShelby({ bytes, blobName })
        : {};

    const response: UploadResponse = {
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        blobName,
        provider,
        ...shelbyResult,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Upload failed:", error);
    const message =
      error instanceof Error && error.message.includes("required when")
        ? error.message
        : "Unable to upload this file. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
