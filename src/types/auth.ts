// @ts-nocheck
export type SessionUser = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "SALES" | "ACCOUNTANT" | "HR" | "GENERAL_MANAGER"
}

// import type { UserRole } from "@/lib/constants"

// export type SessionUser = {
//   id:    string
//   name:  string
//   email: string
//   role:  UserRole
// }