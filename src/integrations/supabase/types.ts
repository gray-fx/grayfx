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
      athletes: {
        Row: {
          created_at: string
          first_name: string
          grade: string | null
          id: string
          jersey_number: string | null
          last_name: string
          level: string
          school_name: string
          school_url: string
          season: string
          sport: string
        }
        Insert: {
          created_at?: string
          first_name: string
          grade?: string | null
          id?: string
          jersey_number?: string | null
          last_name: string
          level: string
          school_name: string
          school_url: string
          season: string
          sport: string
        }
        Update: {
          created_at?: string
          first_name?: string
          grade?: string | null
          id?: string
          jersey_number?: string | null
          last_name?: string
          level?: string
          school_name?: string
          school_url?: string
          season?: string
          sport?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean
          note: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          note?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          note?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          comments: string | null
          contact: string
          created_at: string
          event_date: string
          event_location: string
          event_type: string
          id: string
          instagram: string | null
          name: string
          party_size: number
        }
        Insert: {
          comments?: string | null
          contact: string
          created_at?: string
          event_date: string
          event_location: string
          event_type: string
          id?: string
          instagram?: string | null
          name: string
          party_size?: number
        }
        Update: {
          comments?: string | null
          contact?: string
          created_at?: string
          event_date?: string
          event_location?: string
          event_type?: string
          id?: string
          instagram?: string | null
          name?: string
          party_size?: number
        }
        Relationships: []
      }
      client_galleries: {
        Row: {
          created_at: string
          event_date: string | null
          id: string
          name: string
          password_hash: string
          slug: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          id?: string
          name: string
          password_hash?: string
          slug: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          id?: string
          name?: string
          password_hash?: string
          slug?: string
        }
        Relationships: []
      }
      client_gallery_favorites: {
        Row: {
          created_at: string
          gallery_id: string
          id: string
          photo_id: string
        }
        Insert: {
          created_at?: string
          gallery_id: string
          id?: string
          photo_id: string
        }
        Update: {
          created_at?: string
          gallery_id?: string
          id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_gallery_favorites_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "client_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_gallery_favorites_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: true
            referencedRelation: "client_gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      client_gallery_photos: {
        Row: {
          created_at: string
          file_name: string
          gallery_id: string
          id: string
          image_url: string
          sort_order: number
          storage_path: string
          taken_at: string | null
        }
        Insert: {
          created_at?: string
          file_name?: string
          gallery_id: string
          id?: string
          image_url: string
          sort_order?: number
          storage_path?: string
          taken_at?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          gallery_id?: string
          id?: string
          image_url?: string
          sort_order?: number
          storage_path?: string
          taken_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_gallery_photos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "client_galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string
          category: string
          created_at: string
          display_location: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          caption?: string
          category?: string
          created_at?: string
          display_location?: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          caption?: string
          category?: string
          created_at?: string
          display_location?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: []
      }
      games: {
        Row: {
          code: string
          created_at: string
          id: string
          kind: string
          name: string
          pin: string
          state: Json
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          kind: string
          name?: string
          pin?: string
          state?: Json
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          pin?: string
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_photos: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_url: string
          portfolio_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          image_url: string
          portfolio_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          portfolio_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_photos_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          description: string
          id: string
          is_primary: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_primary?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_primary?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          code: string
          created_at: string
          id: string
          kind: string
          path: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          kind: string
          path: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          kind?: string
          path?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff_guide: {
        Row: {
          content_html: string
          id: number
          updated_at: string
          updated_by_discord_id: string | null
          updated_by_tag: string | null
        }
        Insert: {
          content_html?: string
          id?: number
          updated_at?: string
          updated_by_discord_id?: string | null
          updated_by_tag?: string | null
        }
        Update: {
          content_html?: string
          id?: number
          updated_at?: string
          updated_by_discord_id?: string | null
          updated_by_tag?: string | null
        }
        Relationships: []
      }
      staff_guide_settings: {
        Row: {
          id: number
          password_hash: string
        }
        Insert: {
          id?: number
          password_hash: string
        }
        Update: {
          id?: number
          password_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_gallery_pw_ok: {
        Args: {
          _g: Database["public"]["Tables"]["client_galleries"]["Row"]
          _pw: string
        }
        Returns: boolean
      }
      get_client_gallery: {
        Args: { _pw: string; _slug: string }
        Returns: Json
      }
      set_client_favorite: {
        Args: { _fav: boolean; _photo_id: string; _pw: string; _slug: string }
        Returns: boolean
      }
      set_client_gallery_password: {
        Args: { _id: string; _pw: string }
        Returns: undefined
      }
      set_guide_password: {
        Args: { new_pw: string; old_pw: string }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      verify_guide_password: { Args: { pw: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
