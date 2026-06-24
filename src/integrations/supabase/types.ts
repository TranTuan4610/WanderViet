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
      bookings: {
        Row: {
          created_at: string
          customer_email_sent: boolean
          customer_info: Json | null
          email_sent_at: string | null
          id: string
          owner_email_sent: boolean
          payment_method: string | null
          ref_id: string
          ref_title: string | null
          room_id: string | null
          status: string
          total: number
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email_sent?: boolean
          customer_info?: Json | null
          email_sent_at?: string | null
          id?: string
          owner_email_sent?: boolean
          payment_method?: string | null
          ref_id: string
          ref_title?: string | null
          room_id?: string | null
          status?: string
          total?: number
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email_sent?: boolean
          customer_info?: Json | null
          email_sent_at?: string | null
          id?: string
          owner_email_sent?: boolean
          payment_method?: string | null
          ref_id?: string
          ref_title?: string | null
          room_id?: string | null
          status?: string
          total?: number
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hotel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image: string | null
          published: boolean
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image?: string | null
          published?: boolean
          title: string
          type?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image?: string | null
          published?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          attempt: number
          booking_id: string | null
          booking_type: string | null
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          idempotency_key: string
          recipient: string
          request_body: Json | null
          response_body: string | null
          response_code: number | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt?: number
          booking_id?: string | null
          booking_type?: string | null
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          recipient: string
          request_body?: Json | null
          response_body?: string | null
          response_code?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          booking_id?: string | null
          booking_type?: string | null
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          recipient?: string
          request_body?: Json | null
          response_body?: string | null
          response_code?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          ref_id: string
          ref_image: string | null
          ref_price: number | null
          ref_title: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ref_id: string
          ref_image?: string | null
          ref_price?: number | null
          ref_title?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ref_id?: string
          ref_image?: string | null
          ref_price?: number | null
          ref_title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      flights: {
        Row: {
          airline: string
          arrive: string
          baggage: string | null
          created_at: string
          depart: string
          duration: string | null
          from_code: string
          id: string
          price: number
          to_code: string
          updated_at: string
        }
        Insert: {
          airline: string
          arrive: string
          baggage?: string | null
          created_at?: string
          depart: string
          duration?: string | null
          from_code: string
          id?: string
          price?: number
          to_code: string
          updated_at?: string
        }
        Update: {
          airline?: string
          arrive?: string
          baggage?: string | null
          created_at?: string
          depart?: string
          duration?: string | null
          from_code?: string
          id?: string
          price?: number
          to_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_rooms: {
        Row: {
          available: number | null
          base_people: number
          base_price: number
          beds: number
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          image: string | null
          max_people: number
          name: string
          owner_email: string | null
          vip: boolean
        }
        Insert: {
          available?: number | null
          base_people?: number
          base_price?: number
          beds?: number
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          image?: string | null
          max_people?: number
          name: string
          owner_email?: string | null
          vip?: boolean
        }
        Update: {
          available?: number | null
          base_people?: number
          base_price?: number
          beds?: number
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          image?: string | null
          max_people?: number
          name?: string
          owner_email?: string | null
          vip?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "hotel_rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          check_in: string | null
          check_out: string | null
          city: string
          created_at: string
          description: string | null
          gallery: Json
          id: string
          image: string | null
          name: string
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          price: number
          rating: number | null
          requirements: string | null
          stars: number
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          city: string
          created_at?: string
          description?: string | null
          gallery?: Json
          id?: string
          image?: string | null
          name: string
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          price?: number
          rating?: number | null
          requirements?: string | null
          stars?: number
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          city?: string
          created_at?: string
          description?: string | null
          gallery?: Json
          id?: string
          image?: string | null
          name?: string
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          price?: number
          rating?: number | null
          requirements?: string | null
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          ref_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          id?: string
          rating: number
          ref_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          ref_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tours: {
        Row: {
          created_at: string
          days: number
          description: string | null
          destination: string
          excluded: Json | null
          gallery: Json
          id: string
          image: string | null
          included: Json | null
          nights: number
          price: number
          rating: number | null
          schedule: Json | null
          seats_left: number | null
          stars: number | null
          title: string
          type: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          days?: number
          description?: string | null
          destination: string
          excluded?: Json | null
          gallery?: Json
          id?: string
          image?: string | null
          included?: Json | null
          nights?: number
          price?: number
          rating?: number | null
          schedule?: Json | null
          seats_left?: number | null
          stars?: number | null
          title: string
          type?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          days?: number
          description?: string | null
          destination?: string
          excluded?: Json | null
          gallery?: Json
          id?: string
          image?: string | null
          included?: Json | null
          nights?: number
          price?: number
          rating?: number | null
          schedule?: Json | null
          seats_left?: number | null
          stars?: number | null
          title?: string
          type?: string | null
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vouchers: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          starts_at: string | null
          status: string
          usage_limit: number | null
          used: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          usage_limit?: number | null
          used?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          usage_limit?: number | null
          used?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_voucher_used: {
        Args: { _voucher_id: string }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
