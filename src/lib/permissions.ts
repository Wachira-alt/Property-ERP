// @ts-nocheck
import type { UserRole } from "@/lib/constants"

export type Action =
  | "CREATE_CONTACT"
  | "UPDATE_CONTACT"
  | "DELETE_CONTACT"
  | "MOVE_TO_AMBER"
  | "MOVE_TO_CLOSED"
  | "EXTEND_RESERVATION"
  | "CANCEL_OPPORTUNITY"
  | "CREATE_LEDGER_ENTRY"
  | "MARK_PAYMENT_PAID"
  | "GENERATE_OFFER_LETTER"
  | "UPLOAD_DOCUMENT"
  | "MANAGE_TEAM"
  | "MANAGE_INVENTORY"
  | "SEND_CAMPAIGN"
  | "VIEW_FINANCE"

const PERMISSIONS: Record<Action, UserRole[]> = {
  CREATE_CONTACT:       ["ADMIN", "SALES", "HR", "GENERAL_MANAGER"],
  UPDATE_CONTACT:       ["ADMIN", "SALES", "HR", "GENERAL_MANAGER"],
  DELETE_CONTACT:       ["ADMIN"],
  MOVE_TO_AMBER:        ["ADMIN", "SALES", "GENERAL_MANAGER"],
  MOVE_TO_CLOSED:       ["ADMIN", "GENERAL_MANAGER"],
  EXTEND_RESERVATION:   ["GENERAL_MANAGER"],
  CANCEL_OPPORTUNITY:   ["ADMIN", "GENERAL_MANAGER"],
  CREATE_LEDGER_ENTRY:  ["ADMIN", "SALES", "GENERAL_MANAGER"],
  MARK_PAYMENT_PAID:    ["ADMIN", "ACCOUNTANT"],
  GENERATE_OFFER_LETTER:["ADMIN", "SALES", "GENERAL_MANAGER"],
  UPLOAD_DOCUMENT:      ["ADMIN", "SALES", "HR", "GENERAL_MANAGER"],
  MANAGE_TEAM:          ["ADMIN"],
  MANAGE_INVENTORY:     ["ADMIN", "GENERAL_MANAGER"],
  SEND_CAMPAIGN:        ["ADMIN", "SALES", "GENERAL_MANAGER"],
  VIEW_FINANCE:         ["ADMIN", "ACCOUNTANT", "GENERAL_MANAGER"],
}

export function canPerform(role: UserRole, action: Action): boolean {
  return PERMISSIONS[action].includes(role)
}

// Use this in server actions — throws if not permitted
export function assertPermission(role: UserRole, action: Action): void {
  if (!canPerform(role, action)) {
    throw new Error(`FORBIDDEN: Role ${role} cannot perform ${action}`)
  }
}