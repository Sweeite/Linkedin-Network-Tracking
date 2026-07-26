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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      content_ideas: {
        Row: {
          angle: string | null
          created_at: string | null
          id: string
          linked_post_id: string | null
          notes: string | null
          prompt_question: string
          source_refs: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          why_now: string | null
        }
        Insert: {
          angle?: string | null
          created_at?: string | null
          id?: string
          linked_post_id?: string | null
          notes?: string | null
          prompt_question: string
          source_refs?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          why_now?: string | null
        }
        Update: {
          angle?: string | null
          created_at?: string | null
          id?: string
          linked_post_id?: string | null
          notes?: string | null
          prompt_question?: string
          source_refs?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          why_now?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_linked_post_id_fkey"
            columns: ["linked_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_log: {
        Row: {
          created_at: string | null
          entry_date: string
          id: string
          source_type: string | null
          tags: string[] | null
          takeaway: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entry_date?: string
          id?: string
          source_type?: string | null
          tags?: string[] | null
          takeaway?: string | null
          title: string
          url?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          id?: string
          source_type?: string | null
          tags?: string[] | null
          takeaway?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          asked_what_i_do: boolean | null
          company: string | null
          connected_date: string | null
          conversation_depth: string | null
          created_at: string | null
          id: string
          last_contact_date: string | null
          name: string
          notes: string | null
          pain_point: string | null
          role: string | null
          source: string | null
          stage: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asked_what_i_do?: boolean | null
          company?: string | null
          connected_date?: string | null
          conversation_depth?: string | null
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          name: string
          notes?: string | null
          pain_point?: string | null
          role?: string | null
          source?: string | null
          stage?: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          asked_what_i_do?: boolean | null
          company?: string | null
          connected_date?: string | null
          conversation_depth?: string | null
          created_at?: string | null
          id?: string
          last_contact_date?: string | null
          name?: string
          notes?: string | null
          pain_point?: string | null
          role?: string | null
          source?: string | null
          stage?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments: number | null
          created_at: string | null
          date_posted: string | null
          id: string
          likes: number | null
          notes: string | null
          shares: number | null
          title: string | null
          updated_at: string | null
          user_id: string
          views: number | null
        }
        Insert: {
          comments?: number | null
          created_at?: string | null
          date_posted?: string | null
          id?: string
          likes?: number | null
          notes?: string | null
          shares?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
        }
        Update: {
          comments?: number | null
          created_at?: string | null
          date_posted?: string | null
          id?: string
          likes?: number | null
          notes?: string | null
          shares?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          views?: number | null
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
