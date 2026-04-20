// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { uploadToDrive } from "@/lib/google-drive"

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg":      "jpg",
  "image/png":       "png",
  "image/jpg":       "jpg",
}

const MAX_SIZE = 8 * 1024 * 1024 // 8MB

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get("file") as File | null
    const docType  = formData.get("docType") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "File type not allowed. Use PDF, JPG, or PNG." },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 8MB." },
        { status: 400 }
      )
    }

    const buffer   = Buffer.from(await file.arrayBuffer())
    const ext      = ALLOWED_TYPES[file.type]
    const safeName = `${docType ?? "document"}-${Date.now()}.${ext}`

    const { fileId, fileUrl, viewUrl } = await uploadToDrive({
      fileName: safeName,
      mimeType: file.type,
      buffer,
    })

    return NextResponse.json({
      fileId,
      fileUrl,
      viewUrl,
      fileName: safeName,
    })
  } catch (err) {
    console.error("[upload]", err)
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    )
  }
}