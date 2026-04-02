import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE    = 25 * 1024 * 1024 // 25MB
const ALLOWED_TYPES: Record<string, boolean> = {
  "application/pdf":       true,
  "image/jpeg":            true,
  "image/png":             true,
  "image/gif":             true,
  "application/msword":    true,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData   = await req.formData()
    const file       = formData.get("file") as File | null
    const campaignId = formData.get("campaignId") as string | null

    if (!file)       return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 })

    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "File type not allowed. Use PDF, image, or Word document." },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 25MB per attachment." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Store file content as base64 — no Drive upload needed for email attachments
    const attachment = await prisma.campaignAttachment.create({
      data: {
        campaignId,
        fileName: file.name,
        fileUrl:  "",                        // not used for email attachments
        fileKey:  buffer.toString("base64"), // base64 file content
        mimeType: file.type,
      },
    })

    return NextResponse.json({ success: true, attachment })
  } catch (err) {
    console.error("[upload-attachment]", err)
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    )
  }
}