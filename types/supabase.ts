export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Debtors: {
        Row: {
          id: string
          acc_number: string
          name: string
          surname_company_trust: string
          outstanding_balance: number
        }
        Insert: {
          id?: string
          acc_number: string
          name: string
          surname_company_trust: string
          outstanding_balance: number
        }
        Update: {
          id?: string
          acc_number?: string
          name?: string
          surname_company_trust?: string
          outstanding_balance?: number
        }
        Relationships: []
      }
      admin_templates: {
        Row: {
          id: string
          account_number: string | null
          date: string
          query_type: string
          description: string
          status: string
          escalated_department: string | null
          agent_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_number?: string | null
          date: string
          query_type: string
          description: string
          status: string
          escalated_department?: string | null
          agent_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_number?: string | null
          date?: string
          query_type?: string
          description?: string
          status?: string
          escalated_department?: string | null
          agent_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_templates_agent_id_fkey"
            columns: ["agent_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
        }
        Insert: {
          id?: string
          email: string
          name: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
