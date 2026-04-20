// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { OfferLetterPDF } from "@/components/pdf/OfferLetter"
import React from "react"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const contactId = req.nextUrl.searchParams.get("contactId")
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 })
  }

  try {
    const contact = await prisma.contact.findUnique({
      where:   { id: contactId },
      include: {
        project:     true,
        opportunity: {
          include: {
            unit:          { include: { unitType: true } },
            ledgerEntries: { orderBy: { dueDate: "asc" } },
          },
        },
      },
    })

    if (!contact || !contact.opportunity) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const opp = contact.opportunity

    if (!opp.agreedPrice || !opp.paymentMethod || !opp.unit) {
      return NextResponse.json(
        { error: "Opportunity is missing required data for offer letter" },
        { status: 400 }
      )
    }

    const referenceNo = `OFR-${contact.id.slice(-6).toUpperCase()}`
    const offerDate   = new Date().toLocaleDateString("en-KE", {
      day: "2-digit", month: "long", year: "numeric",
    })

    const buffer = await renderToBuffer(
      React.createElement(OfferLetterPDF, {
        contactName:   `${contact.firstName} ${contact.lastName}`,
        contactPhone:  contact.phone,
        contactEmail:  contact.email,
        projectName:   contact.project.name,
        unitName:      opp.unit.name,
        unitType:      opp.unit.unitType.name,
        agreedPrice:   Number(opp.agreedPrice),
        paymentMethod: opp.paymentMethod,
        ledgerEntries: opp.ledgerEntries.map((e) => ({
          description: e.description,
          amount:      Number(e.amount),
          dueDate:     e.dueDate,
        })),
        offerDate,
        referenceNo,
      })
    )

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `inline; filename="offer-letter-${referenceNo}.pdf"`,
      },
    })
  } catch (err) {
    console.error("[offer-letter]", err)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}