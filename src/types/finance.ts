// @ts-nocheck
export type PaymentStatus = "PENDING" | "PAID" | "OVERDUE"

export type LedgerEntryForTable = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  status:      PaymentStatus
  paidAt:      Date | null
  paymentRef:  string | null
  opportunity: {
    contact: {
      id:        string
      firstName: string
      lastName:  string
    }
    unit: { name: string } | null
  }
}

export type StatementEntry = {
  id:          string
  description: string
  amount:      number | { toNumber: () => number }
  dueDate:     Date
  paidAt:      Date | null
  paymentRef:  string | null
  status:      PaymentStatus
}

export type ContactStatement = {
  contactId:   string
  contactName: string
  unitName:    string | null
  agreedPrice: number
  entries:     StatementEntry[]
}

export type FinanceSummary = {
  totalScheduled: number
  totalPaid:      number
  totalOverdue:   number
}