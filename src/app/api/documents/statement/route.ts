import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { StatementPDF } from "@/components/pdf/Statement"
import React from "react"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contactId = req.nextUrl.searchParams.get("contactId")
  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 })

  const contact = await prisma.contact.findUnique({
    where:   { id: contactId },
    include: {
      project: true,
      opportunity: {
        include: {
          unit:          { include: { unitType: true } },
          ledgerEntries: { orderBy: { dueDate: "asc" } },
        },
      },
    },
  })

  if (!contact || !contact.opportunity) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const opp = contact.opportunity
  const ref = `SOA-${contact.id.slice(-6).toUpperCase()}`
  const generatedAt = new Date().toLocaleDateString("en-KE", {
    day: "2-digit", month: "long", year: "numeric",
  })

  const buffer = await renderToBuffer(
    React.createElement(StatementPDF, {
      contactName:  `${contact.firstName} ${contact.lastName}`,
      contactPhone: contact.phone,
      contactEmail: contact.email,
      unitName:     opp.unit?.name ?? "—",
      projectName:  contact.project.name,
      agreedPrice:  Number(opp.agreedPrice ?? 0),
      entries:      opp.ledgerEntries.map((e) => ({
        description: e.description,
        amount:      Number(e.amount),
        dueDate:     e.dueDate,
        paidAt:      e.paidAt,
        paymentRef:  e.paymentRef,
        status:      e.status,
      })),
      generatedAt,
      referenceNo: ref,
    })
  )

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="statement-${ref}.pdf"`,
    },
  })
}