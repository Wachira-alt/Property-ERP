import { renderToStream } from '@react-pdf/renderer';
import { OfferLetterPDF } from '@/components/documents/OfferLetterPDF';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return new NextResponse("ID Required", { status: 400 });

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: { 
      contact: { include: { project: true } }, 
      unit: { include: { unitType: true } }, 
      ledgerEntries: { orderBy: { dueDate: 'asc' } } 
    }
  });

  if (!opportunity) return new NextResponse("Data Not Found", { status: 404 });

  // Render the React component to a PDF stream
  const stream = await renderToStream(
    <OfferLetterPDF 
      contact={opportunity.contact} 
      opportunity={opportunity} 
      ledgerEntries={opportunity.ledgerEntries} 
    />
  );

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Offer_${opportunity.contact.lastName}.pdf"`,
    },
  });
}