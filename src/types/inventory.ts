export type UnitStatus     = "AVAILABLE" | "RESERVED" | "SOLD"
export type PaymentMethod  = "CASH" | "MORTGAGE"

export type ProjectBasic = {
  id:   string
  name: string
}

export type UnitTypeBasic = {
  id:        string
  name:      string
  projectId: string
}

export type UnitBasic = {
  id:       string
  name:     string
  floor:    string | null
  unitType: { name: string; projectId: string }
}

export type UnitWithType = {
  id:       string
  name:     string
  floor:    string | null
  status:   UnitStatus
  unitType: {
    id:      string
    name:    string
    project: ProjectBasic
  }
}

export type UnitTypeWithUnits = {
  id:          string
  name:        string
  description: string | null
  units:       {
    id:    string
    name:  string
    floor: string | null
    status: UnitStatus
  }[]
}

export type ProjectWithUnitTypes = {
  id:          string
  name:        string
  location:    string | null
  description: string | null
  isActive:    boolean
  createdAt:   Date
  unitTypes:   UnitTypeWithUnits[]
}

export type ProjectSummary = {
  id:        string
  name:      string
  total:     number
  available: number
  reserved:  number
  sold:      number
  soldPct:   number
}