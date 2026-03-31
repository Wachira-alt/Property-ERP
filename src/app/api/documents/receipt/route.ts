import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { PaymentReceiptPDF } from "@/components/pdf/PaymentReceipt"
import React from "react"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const entryId = req.nextUrl.searchParams.get("entryId")
  if (!entryId) return NextResponse.json({ error: "entryId required" }, { status: 400 })

  const entry = await prisma.ledgerEntry.findUnique({
    where:   { id: entryId },
    include: {
      opportunity: {
        include: {
          contact: true,
          unit:    { include: { unitType: { include: { project: true } } } },
        },
      },
    },
  })

  if (!entry || !entry.paidAt || !entry.paymentRef) {
    return NextResponse.json({ error: "Entry not found or not paid" }, { status: 404 })
  }

  const contact = entry.opportunity.contact
  const unit    = entry.opportunity.unit
  const ref     = `RCP-${entry.id.slice(-6).toUpperCase()}`

  const buffer = await renderToBuffer(
    React.createElement(PaymentReceiptPDF, {
      contactName:  `${contact.firstName} ${contact.lastName}`,
      contactPhone: contact.phone,
      unitName:     unit?.name ?? "—",
      projectName:  unit?.unitType.project.name ?? "—",
      description:  entry.description,
      amount:       Number(entry.amount),
      paidAt:       entry.paidAt,
      paymentRef:   entry.paymentRef,
      receiptNo:    ref,
    })
  )

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="receipt-${ref}.pdf"`,
    },
  })
}