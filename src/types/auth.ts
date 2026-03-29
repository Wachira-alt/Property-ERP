export type SessionUser = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "SALES" | "ACCOUNTANT" | "HR" | "GENERAL_MANAGER"
}