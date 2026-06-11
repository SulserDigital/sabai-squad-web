/**
 * Supabase Database Types
 * Generated from the SabaiSquad schema.
 * Regenerate with: supabase gen types typescript --project-id maodnlvgriwsmowysyxp > src/lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          login_method: string | null;
          role: string;
          created_at: string;
          updated_at: string;
          last_signed_in: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          login_method?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
          last_signed_in?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          login_method?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
          last_signed_in?: string;
        };
      };
      trips: {
        Row: {
          id: number;
          name: string;
          destination: string | null;
          description: string | null;
          currency: string;
          start_date: string | null;
          end_date: string | null;
          cover_image: string | null;
          invite_code: string | null;
          owner_id: string;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          destination?: string | null;
          description?: string | null;
          currency?: string;
          start_date?: string | null;
          end_date?: string | null;
          cover_image?: string | null;
          invite_code?: string | null;
          owner_id: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          destination?: string | null;
          description?: string | null;
          currency?: string;
          start_date?: string | null;
          end_date?: string | null;
          cover_image?: string | null;
          invite_code?: string | null;
          owner_id?: string;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      trip_members: {
        Row: {
          id: number;
          trip_id: number;
          user_id: string | null;
          display_name: string;
          emoji: string | null;
          role: string;
          color: string | null;
          arrival_date: string | null;
          departure_date: string | null;
          current_location: string | null;
          location_from: string | null;
          location_to: string | null;
          avatar_url: string | null;
          avatar_icon: string | null;
          avatar_color: string | null;
          personal_notes: string | null;
          joined_at: string;
        };
        Insert: {
          id?: number;
          trip_id: number;
          user_id?: string | null;
          display_name: string;
          emoji?: string | null;
          role?: string;
          color?: string | null;
          arrival_date?: string | null;
          departure_date?: string | null;
          current_location?: string | null;
          location_from?: string | null;
          location_to?: string | null;
          avatar_url?: string | null;
          avatar_icon?: string | null;
          avatar_color?: string | null;
          personal_notes?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: number;
          trip_id?: number;
          user_id?: string | null;
          display_name?: string;
          emoji?: string | null;
          role?: string;
          color?: string | null;
          arrival_date?: string | null;
          departure_date?: string | null;
          current_location?: string | null;
          location_from?: string | null;
          location_to?: string | null;
          avatar_url?: string | null;
          avatar_icon?: string | null;
          avatar_color?: string | null;
          personal_notes?: string | null;
          joined_at?: string;
        };
      };
      expenses: {
        Row: {
          id: number;
          trip_id: number;
          title: string;
          description: string | null;
          category: string;
          total_amount: number;
          currency: string;
          paid_by_member_id: number;
          split_type: string;
          date: string;
          is_personal: boolean;
          personal_amount: number;
          payment_method: string;
          receipt_url: string | null;
          created_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          trip_id: number;
          title: string;
          description?: string | null;
          category?: string;
          total_amount: number;
          currency?: string;
          paid_by_member_id: number;
          split_type?: string;
          date?: string;
          is_personal?: boolean;
          personal_amount?: number;
          payment_method?: string;
          receipt_url?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          trip_id?: number;
          title?: string;
          description?: string | null;
          category?: string;
          total_amount?: number;
          currency?: string;
          paid_by_member_id?: number;
          split_type?: string;
          date?: string;
          is_personal?: boolean;
          personal_amount?: number;
          payment_method?: string;
          receipt_url?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_participants: {
        Row: {
          id: number;
          expense_id: number;
          member_id: number;
          share_amount: number | null;
          share_percentage: number | null;
        };
        Insert: {
          id?: number;
          expense_id: number;
          member_id: number;
          share_amount?: number | null;
          share_percentage?: number | null;
        };
        Update: {
          id?: number;
          expense_id?: number;
          member_id?: number;
          share_amount?: number | null;
          share_percentage?: number | null;
        };
      };
      activities: {
        Row: {
          id: number;
          trip_id: number;
          title: string;
          description: string | null;
          location: string | null;
          estimated_cost: number | null;
          currency: string | null;
          category: string | null;
          status: string;
          scheduled_date: string | null;
          scheduled_time: string | null;
          proposed_by_member_id: number | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          trip_id: number;
          title: string;
          description?: string | null;
          location?: string | null;
          estimated_cost?: number | null;
          currency?: string | null;
          category?: string | null;
          status?: string;
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          proposed_by_member_id?: number | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          trip_id?: number;
          title?: string;
          description?: string | null;
          location?: string | null;
          estimated_cost?: number | null;
          currency?: string | null;
          category?: string | null;
          status?: string;
          scheduled_date?: string | null;
          scheduled_time?: string | null;
          proposed_by_member_id?: number | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_votes: {
        Row: { id: number; activity_id: number; member_id: number; vote: string; created_at: string };
        Insert: { id?: number; activity_id: number; member_id: number; vote: string; created_at?: string };
        Update: { id?: number; activity_id?: number; member_id?: number; vote?: string; created_at?: string };
      };
      activity_comments: {
        Row: { id: number; activity_id: number; member_id: number; content: string; created_at: string; updated_at: string };
        Insert: { id?: number; activity_id: number; member_id: number; content: string; created_at?: string; updated_at?: string };
        Update: { id?: number; activity_id?: number; member_id?: number; content?: string; created_at?: string; updated_at?: string };
      };
      chat_messages: {
        Row: { id: number; trip_id: number; member_id: number; content: string; message_type: string; media_url: string | null; reply_to_id: number | null; created_at: string; edited_at: string | null };
        Insert: { id?: number; trip_id: number; member_id: number; content: string; message_type?: string; media_url?: string | null; reply_to_id?: number | null; created_at?: string; edited_at?: string | null };
        Update: { id?: number; trip_id?: number; member_id?: number; content?: string; message_type?: string; media_url?: string | null; reply_to_id?: number | null; created_at?: string; edited_at?: string | null };
      };
      timeline_events: {
        Row: { id: number; trip_id: number; title: string; description: string | null; location: string | null; event_type: string; start_time: string; end_time: string | null; participant_ids: Json; confirmation_number: string | null; cost: number | null; currency: string | null; created_by_user_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; title: string; description?: string | null; location?: string | null; event_type?: string; start_time: string; end_time?: string | null; participant_ids?: Json; confirmation_number?: string | null; cost?: number | null; currency?: string | null; created_by_user_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; title?: string; description?: string | null; location?: string | null; event_type?: string; start_time?: string; end_time?: string | null; participant_ids?: Json; confirmation_number?: string | null; cost?: number | null; currency?: string | null; created_by_user_id?: string | null; created_at?: string; updated_at?: string };
      };
      vault_documents: {
        Row: { id: number; trip_id: number | null; user_id: string; title: string; document_type: string; file_key: string | null; file_url: string | null; mime_type: string | null; is_encrypted: boolean; encryption_iv: string | null; expiry_date: string | null; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id?: number | null; user_id: string; title: string; document_type?: string; file_key?: string | null; file_url?: string | null; mime_type?: string | null; is_encrypted?: boolean; encryption_iv?: string | null; expiry_date?: string | null; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number | null; user_id?: string; title?: string; document_type?: string; file_key?: string | null; file_url?: string | null; mime_type?: string | null; is_encrypted?: boolean; encryption_iv?: string | null; expiry_date?: string | null; notes?: string | null; created_at?: string; updated_at?: string };
      };
      tips: {
        Row: { id: number; trip_id: number; category: string; title: string; description: string; created_by_user_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; category: string; title: string; description: string; created_by_user_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; category?: string; title?: string; description?: string; created_by_user_id?: string | null; created_at?: string; updated_at?: string };
      };
      accommodations: {
        Row: { id: number; trip_id: number; name: string; type: string; address: string | null; maps_link: string | null; checkin_date: string | null; checkout_date: string | null; price_per_night: number | null; total_price: number | null; currency: string | null; platform: string | null; booking_ref: string | null; access_code: string | null; wifi_password: string | null; house_rules: string | null; residents: Json; created_by_user_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; name: string; type: string; address?: string | null; maps_link?: string | null; checkin_date?: string | null; checkout_date?: string | null; price_per_night?: number | null; total_price?: number | null; currency?: string | null; platform?: string | null; booking_ref?: string | null; access_code?: string | null; wifi_password?: string | null; house_rules?: string | null; residents?: Json; created_by_user_id?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; name?: string; type?: string; address?: string | null; maps_link?: string | null; checkin_date?: string | null; checkout_date?: string | null; price_per_night?: number | null; total_price?: number | null; currency?: string | null; platform?: string | null; booking_ref?: string | null; access_code?: string | null; wifi_password?: string | null; house_rules?: string | null; residents?: Json; created_by_user_id?: string | null; created_at?: string; updated_at?: string };
      };
      accommodation_contacts: {
        Row: { id: number; accommodation_id: number; name: string; role: string | null; phone: string | null; line_id: string | null };
        Insert: { id?: number; accommodation_id: number; name: string; role?: string | null; phone?: string | null; line_id?: string | null };
        Update: { id?: number; accommodation_id?: number; name?: string; role?: string | null; phone?: string | null; line_id?: string | null };
      };
      planned_stays: {
        Row: { id: number; trip_id: number; member_id: number; location: string; from_date: string; to_date: string; note: string | null; source: string; accommodation_id: number | null; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; member_id: number; location: string; from_date: string; to_date: string; note?: string | null; source?: string; accommodation_id?: number | null; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; member_id?: number; location?: string; from_date?: string; to_date?: string; note?: string | null; source?: string; accommodation_id?: number | null; created_at?: string; updated_at?: string };
      };
      stay_invitations: {
        Row: { id: number; stay_id: number; member_id: number; status: string; accepted_from_date: string | null; accepted_to_date: string | null; accepted_note: string | null; accommodation_id: number | null; created_at: string; updated_at: string };
        Insert: { id?: number; stay_id: number; member_id: number; status?: string; accepted_from_date?: string | null; accepted_to_date?: string | null; accepted_note?: string | null; accommodation_id?: number | null; created_at?: string; updated_at?: string };
        Update: { id?: number; stay_id?: number; member_id?: number; status?: string; accepted_from_date?: string | null; accepted_to_date?: string | null; accepted_note?: string | null; accommodation_id?: number | null; created_at?: string; updated_at?: string };
      };
      shopping_lists: {
        Row: { id: number; trip_id: number; name: string; created_by: number; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; name: string; created_by: number; is_archived?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; name?: string; created_by?: number; is_archived?: boolean; created_at?: string; updated_at?: string };
      };
      shopping_items: {
        Row: { id: number; list_id: number; name: string; quantity: string | null; image_url: string | null; is_checked: boolean; checked_by: number | null; added_by: number; created_at: string; updated_at: string };
        Insert: { id?: number; list_id: number; name: string; quantity?: string | null; image_url?: string | null; is_checked?: boolean; checked_by?: number | null; added_by: number; created_at?: string; updated_at?: string };
        Update: { id?: number; list_id?: number; name?: string; quantity?: string | null; image_url?: string | null; is_checked?: boolean; checked_by?: number | null; added_by?: number; created_at?: string; updated_at?: string };
      };
      tasks: {
        Row: { id: number; trip_id: number; title: string; description: string | null; assigned_to: number | null; created_by: number; status: string; due_date: string | null; completed_at: string | null; is_private: boolean; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; title: string; description?: string | null; assigned_to?: number | null; created_by: number; status?: string; due_date?: string | null; completed_at?: string | null; is_private?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; title?: string; description?: string | null; assigned_to?: number | null; created_by?: number; status?: string; due_date?: string | null; completed_at?: string | null; is_private?: boolean; created_at?: string; updated_at?: string };
      };
      transports: {
        Row: { id: number; trip_id: number; type: string; from_location: string; to_location: string; departure_date: string | null; arrival_date: string | null; price: number | null; currency: string | null; booking_ref: string | null; notes: string | null; contact_id: number | null; created_by: number; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; type: string; from_location: string; to_location: string; departure_date?: string | null; arrival_date?: string | null; price?: number | null; currency?: string | null; booking_ref?: string | null; notes?: string | null; contact_id?: number | null; created_by: number; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; type?: string; from_location?: string; to_location?: string; departure_date?: string | null; arrival_date?: string | null; price?: number | null; currency?: string | null; booking_ref?: string | null; notes?: string | null; contact_id?: number | null; created_by?: number; created_at?: string; updated_at?: string };
      };
      contacts: {
        Row: { id: number; trip_id: number; name: string; phone: string | null; instagram: string | null; line: string | null; whatsapp: string | null; category: string; note: string | null; photo_url: string | null; is_private: boolean; created_by: number; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; name: string; phone?: string | null; instagram?: string | null; line?: string | null; whatsapp?: string | null; category?: string; note?: string | null; photo_url?: string | null; is_private?: boolean; created_by: number; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; name?: string; phone?: string | null; instagram?: string | null; line?: string | null; whatsapp?: string | null; category?: string; note?: string | null; photo_url?: string | null; is_private?: boolean; created_by?: number; created_at?: string; updated_at?: string };
      };
      packing_items: {
        Row: { id: number; trip_id: number; category: string; name: string; checked: boolean; is_default: boolean; sort_order: number; created_by: number; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; category?: string; name: string; checked?: boolean; is_default?: boolean; sort_order?: number; created_by: number; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; category?: string; name?: string; checked?: boolean; is_default?: boolean; sort_order?: number; created_by?: number; created_at?: string; updated_at?: string };
      };
      news_items: {
        Row: { id: number; trip_id: number; title: string; content: string; category: string; is_pinned: boolean; is_default: boolean; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; title: string; content: string; category?: string; is_pinned?: boolean; is_default?: boolean; created_by: string; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; title?: string; content?: string; category?: string; is_pinned?: boolean; is_default?: boolean; created_by?: string; created_at?: string; updated_at?: string };
      };
      custom_phrases: {
        Row: { id: number; trip_id: number; created_by_user_id: string; german: string; phonetic: string; thai: string; category: string; note: string; created_at: string; updated_at: string };
        Insert: { id?: number; trip_id: number; created_by_user_id: string; german: string; phonetic: string; thai?: string; category?: string; note?: string; created_at?: string; updated_at?: string };
        Update: { id?: number; trip_id?: number; created_by_user_id?: string; german?: string; phonetic?: string; thai?: string; category?: string; note?: string; created_at?: string; updated_at?: string };
      };
      debt_payments: {
        Row: { id: number; trip_id: number; from_member_id: number; to_member_id: number; amount: number; currency: string; note: string; paid_at: string; created_at: string };
        Insert: { id?: number; trip_id: number; from_member_id: number; to_member_id: number; amount: number; currency?: string; note?: string; paid_at?: string; created_at?: string };
        Update: { id?: number; trip_id?: number; from_member_id?: number; to_member_id?: number; amount?: number; currency?: string; note?: string; paid_at?: string; created_at?: string };
      };
    };
    Functions: {
      is_trip_member: { Args: { p_trip_id: number }; Returns: boolean };
      get_my_member_id: { Args: { p_trip_id: number }; Returns: number };
    };
  };
}
