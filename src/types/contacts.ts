// @ts-nocheck
import type { PipelineStage, OpportunityForDetail } from "@/types/pipeline"

export type ContactNote = {
  id:        string
  content:   string
  createdAt: Date
  author:    { id: string; name: string }
}

export type ContactBasic = {
  id:        string
  firstName: string
  lastName:  string
  phone:     string
  email:     string | null
}

// Shape returned by getContacts() — list view
export type ContactListItem = {
  id:        string
  firstName: string
  lastName:  string
  phone:     string
  email:     string | null
  createdAt: Date
  project:   { id: string; name: string }
  agent:     { id: string; name: string }
  opportunity: {
    id:    string
    stage: PipelineStage
    unit:  { id: string; name: string } | null
  } | null
}

// Shape returned by getContactById() — detail view
export type ContactDetail = {
  id:          string
  firstName:   string
  lastName:    string
  phone:       string
  email:       string | null
  projectId:   string
  createdAt:   Date
  updatedAt:   Date
  deletedAt:   Date | null
  project:     { id: string; name: string }
  agent:       { id: string; name: string; role: string }
  notes:       ContactNote[]
  opportunity: OpportunityForDetail | null
}

// Shape used inside stage components
export type ContactForStage = {
  id:        string
  firstName: string
  lastName:  string
  phone:     string
  email:     string | null
}