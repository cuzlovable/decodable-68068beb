export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      matches: {
        Row: {
          chemistry_score: number | null
          created_at: string
          dominant_theme: string | null
          id: string
          status: string
          updated_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          chemistry_score?: number | null
          created_at?: string
          dominant_theme?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          chemistry_score?: number | null
          created_at?: string
          dominant_theme?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          authority: string | null
          avatar_url: string | null
          birth_date: string | null
          birth_latitude: number | null
          birth_location: string | null
          birth_longitude: number | null
          birth_time: string | null
          chart_raw: Json | null
          created_at: string
          defined_centers: string[] | null
          defined_gates: number[] | null
          definition: string | null
          display_name: string | null
          energy_type: string | null
          id: string
          incarnation_cross: string | null
          north_node_environment: string | null
          north_node_gate: number | null
          not_self_theme: string | null
          onboarding_completed: boolean
          profile: string | null
          signature: string | null
          south_node_environment: string | null
          south_node_gate: number | null
          strategy: string | null
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          authority?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_latitude?: number | null
          birth_location?: string | null
          birth_longitude?: number | null
          birth_time?: string | null
          chart_raw?: Json | null
          created_at?: string
          defined_centers?: string[] | null
          defined_gates?: number[] | null
          definition?: string | null
          display_name?: string | null
          energy_type?: string | null
          id?: string
          incarnation_cross?: string | null
          north_node_environment?: string | null
          north_node_gate?: number | null
          not_self_theme?: string | null
          onboarding_completed?: boolean
          profile?: string | null
          signature?: string | null
          south_node_environment?: string | null
          south_node_gate?: number | null
          strategy?: string | null
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          authority?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_latitude?: number | null
          birth_location?: string | null
          birth_longitude?: number | null
          birth_time?: string | null
          chart_raw?: Json | null
          created_at?: string
          defined_centers?: string[] | null
          defined_gates?: number[] | null
          definition?: string | null
          display_name?: string | null
          energy_type?: string | null
          id?: string
          incarnation_cross?: string | null
          north_node_environment?: string | null
          north_node_gate?: number | null
          not_self_theme?: string | null
          onboarding_completed?: boolean
          profile?: string | null
          signature?: string | null
          south_node_environment?: string | null
          south_node_gate?: number | null
          strategy?: string | null
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      unleash_checks: {
        Row: {
          answered_at: string | null
          authority: string
          available_at: string
          created_at: string
          id: string
          match_id: string
          reflection: string | null
          response: string | null
          unleashed: boolean | null
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          authority: string
          available_at?: string
          created_at?: string
          id?: string
          match_id: string
          reflection?: string | null
          response?: string | null
          unleashed?: boolean | null
          user_id: string
        }
        Update: {
          answered_at?: string | null
          authority?: string
          available_at?: string
          created_at?: string
          id?: string
          match_id?: string
          reflection?: string | null
          response?: string | null
          unleashed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unleash_checks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
