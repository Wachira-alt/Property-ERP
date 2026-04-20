// @ts-nocheck
import "server-only"

import { google } from "googleapis"
import { Readable } from "stream"

function getDriveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:   process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  })

  return google.drive({ version: "v3", auth })
}

export async function uploadToDrive({
  fileName,
  mimeType,
  buffer,
  folderId,
}: {
  fileName: string
  mimeType: string
  buffer:   Buffer
  folderId?: string
}): Promise<{ fileId: string; fileUrl: string; viewUrl: string }> {
  const drive  = getDriveClient()
  const folder = folderId ?? process.env.GOOGLE_DRIVE_FOLDER_ID!

  const stream = Readable.from(buffer)

  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name:    fileName,
      parents: [folder],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id, name, webViewLink, webContentLink",
  })

  const fileId = response.data.id!

  // Make the file readable by anyone with the link
  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  })

  // Get final file metadata with links
  const file = await drive.files.get({
    fileId,
    supportsAllDrives: true,
    fields: "id, webViewLink, webContentLink",
  })

  return {
    fileId,
    fileUrl:  file.data.webContentLink ?? `https://drive.google.com/uc?export=download&id=${fileId}`,
    viewUrl:  file.data.webViewLink    ?? `https://drive.google.com/file/d/${fileId}/view`,
  }
}

export async function deleteFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.delete({ fileId, supportsAllDrives: true })
}