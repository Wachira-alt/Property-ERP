export type PipelineStage =
  | "GREEN"
  | "AMBER"
  | "CLOSED"
  | "PAST"
  | "EXPIRED"
  | "CANCELLED"

export type DocumentType =
  | "NATIONAL_ID"
  | "KRA_PIN"
  | "OFFER_LETTER_UNSIGNED"
  | "OFFER_LETTER_SIGNED"
  | "BOOKING_RECEIPT"

export type OpportunityDocument = {
  id:         string
  type:       DocumentType
  fileName:   string
  fileUrl:    string
  fileKey:    string
  uploadedAt: Date
}

export type OpportunityUnit = {
  id:            string
  name:          string
  status:        string
  reservedUntil: Date | null
  unitType:      {
    id:      string
    name:    string
    project: { id: string; name: string }
  }
}

export type OpportunityLedgerEntry = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  status:      string
  paidAt:      Date | null
  paymentRef:  string | null
}

export type OpportunityForDetail = {
  id:            string
  stage:         PipelineStage
  agreedPrice:   number | null | { toNumber: () => number }
  paymentMethod: string | null
  unitId:        string | null
  closedAt:      Date | null
  unit:          OpportunityUnit | null
  ledgerEntries: OpportunityLedgerEntry[]
  documents:     OpportunityDocument[]
}