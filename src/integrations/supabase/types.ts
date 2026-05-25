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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      antenatal_appointments: {
        Row: {
          created_at: string
          done: boolean
          id: string
          kind: string
          notes: string | null
          reminder_minutes: number | null
          scheduled_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          kind?: string
          notes?: string | null
          reminder_minutes?: number | null
          scheduled_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          kind?: string
          notes?: string | null
          reminder_minutes?: number | null
          scheduled_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author_id: string | null
          body: string
          category: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          moderation_status: string
          read_minutes: number | null
          slug: string
          title: string
        }
        Insert: {
          author_id?: string | null
          body: string
          category: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          moderation_status?: string
          read_minutes?: number | null
          slug: string
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          moderation_status?: string
          read_minutes?: number | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      babies: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          id: string
          is_pregnancy: boolean
          name: string
          pregnancy_due_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          is_pregnancy?: boolean
          name: string
          pregnancy_due_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          id?: string
          is_pregnancy?: boolean
          name?: string
          pregnancy_due_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      birth_plans: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          anonymous: boolean
          author_name: string | null
          body: string
          comments_count: number
          created_at: string
          group_id: string | null
          id: string
          likes_count: number
          moderation_status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          anonymous?: boolean
          author_name?: string | null
          body: string
          comments_count?: number
          created_at?: string
          group_id?: string | null
          id?: string
          likes_count?: number
          moderation_status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          anonymous?: boolean
          author_name?: string | null
          body?: string
          comments_count?: number
          created_at?: string
          group_id?: string | null
          id?: string
          likes_count?: number
          moderation_status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_applications: {
        Row: {
          bio: string
          created_at: string
          credentials: string
          full_name: string
          id: string
          review_notes: string | null
          specialties: string[]
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio: string
          created_at?: string
          credentials: string
          full_name: string
          id?: string
          review_notes?: string | null
          specialties?: string[]
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string
          created_at?: string
          credentials?: string
          full_name?: string
          id?: string
          review_notes?: string | null
          specialties?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expert_profiles: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          display_name: string
          id: string
          specialties: string[]
          title: string
          user_id: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio: string
          created_at?: string
          display_name: string
          id?: string
          specialties?: string[]
          title: string
          user_id: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string
          id?: string
          specialties?: string[]
          title?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      hospital_bag_items: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string
          packed: boolean
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          label: string
          packed?: boolean
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string
          packed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      is_this_normal_topics: {
        Row: {
          created_at: string
          id: string
          safe_tips: string[] | null
          slug: string
          summary: string
          symptoms: string[] | null
          title: string
          warning_signs: string[] | null
          when_to_see_doctor: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          safe_tips?: string[] | null
          slug: string
          summary: string
          symptoms?: string[] | null
          title: string
          warning_signs?: string[] | null
          when_to_see_doctor?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          safe_tips?: string[] | null
          slug?: string
          summary?: string
          symptoms?: string[] | null
          title?: string
          warning_signs?: string[] | null
          when_to_see_doctor?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          achieved_at: string
          baby_id: string
          category: string
          created_at: string
          id: string
          notes: string | null
          title: string
          unit: string | null
          user_id: string
          value_numeric: number | null
        }
        Insert: {
          achieved_at?: string
          baby_id: string
          category: string
          created_at?: string
          id?: string
          notes?: string | null
          title: string
          unit?: string | null
          user_id: string
          value_numeric?: number | null
        }
        Update: {
          achieved_at?: string
          baby_id?: string
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          title?: string
          unit?: string | null
          user_id?: string
          value_numeric?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_baby_id_fkey"
            columns: ["baby_id"]
            isOneToOne: false
            referencedRelation: "babies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          scheduled_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          read?: boolean
          scheduled_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          scheduled_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          anonymous: boolean
          author_name: string | null
          body: string
          created_at: string
          id: string
          moderation_status: string
          post_id: string
          user_id: string
        }
        Insert: {
          anonymous?: boolean
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          moderation_status?: string
          post_id: string
          user_id: string
        }
        Update: {
          anonymous?: boolean
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          moderation_status?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancy_logs: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          logged_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: string
          logged_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          logged_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          concerns: string[] | null
          concerns_notes: string | null
          created_at: string
          id: string
          onboarded: boolean
          parent_name: string | null
          support_level: number | null
          updated_at: string
        }
        Insert: {
          concerns?: string[] | null
          concerns_notes?: string | null
          created_at?: string
          id: string
          onboarded?: boolean
          parent_name?: string | null
          support_level?: number | null
          updated_at?: string
        }
        Update: {
          concerns?: string[] | null
          concerns_notes?: string | null
          created_at?: string
          id?: string
          onboarded?: boolean
          parent_name?: string | null
          support_level?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          author_id: string | null
          category: string
          created_at: string
          description: string | null
          duration_seconds: number | null
          expert_name: string | null
          id: string
          likes_count: number
          moderation_status: string
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          expert_name?: string | null
          id?: string
          likes_count?: number
          moderation_status?: string
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          expert_name?: string | null
          id?: string
          likes_count?: number
          moderation_status?: string
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "expert" | "parent"
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
    Enums: {
      app_role: ["admin", "expert", "parent"],
    },
  },
} as const
