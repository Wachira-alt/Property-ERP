export const USER_ROLE = {
  ADMIN: "ADMIN",
  SALES: "SALES",
  ACCOUNTANT: "ACCOUNTANT",
  HR: "HR",
  GENERAL_MANAGER: "GENERAL_MANAGER",
} as const

export const UNIT_STATUS = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
} as const

export const PIPELINE_STAGE = {
  GREEN: "GREEN",
  AMBER: "AMBER",
  CLOSED: "CLOSED",
  PAST:      "PAST",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const

export const PAYMENT_METHOD = {
  CASH: "CASH",
  MORTGAGE: "MORTGAGE",
} as const

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
} as const

export const DOCUMENT_TYPE = {
  NATIONAL_ID: "NATIONAL_ID",
  KRA_PIN: "KRA_PIN",
  OFFER_LETTER_UNSIGNED: "OFFER_LETTER_UNSIGNED",
  OFFER_LETTER_SIGNED: "OFFER_LETTER_SIGNED",
  BOOKING_RECEIPT: "BOOKING_RECEIPT",
} as const

// Derive types from the const objects — single source of truth
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]
export type UnitStatus = (typeof UNIT_STATUS)[keyof typeof UNIT_STATUS]
export type PipelineStage = (typeof PIPELINE_STAGE)[keyof typeof PIPELINE_STAGE]
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]
export type DocumentType = (typeof DOCUMENT_TYPE)[keyof typeof DOCUMENT_TYPE]