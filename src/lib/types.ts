/**
 * Supabase DB 型定義。
 *
 * 本来は `npx supabase gen types typescript --project-id <id> > src/lib/types.ts`
 * で自動生成するが、Supabaseプロジェクト未作成の段階でも開発を進められるよう、
 * `ma-deal-tracker-setup.md` のスキーマに合わせて手書きしている。
 * プロジェクト作成後は上記コマンドで上書き生成して構わない（同じ shape を保つ）。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          id: string;
          deal_name: string;
          deal_type: Database["public"]["Enums"]["deal_type"];
          seller_company: string | null;
          buyer_company: string | null;
          referrer_company: string | null;
          referred_company: string | null;
          current_status: Database["public"]["Enums"]["deal_status"];
          next_action: string | null;
          scheduled_date: string | null;
          transfer_price: number | null;
          retainer_fee: number | null;
          success_fee: number | null;
          remarks_internal: string | null;
          remarks_shared: string | null;
          share_token: string | null;
          share_enabled: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          deal_name: string;
          deal_type: Database["public"]["Enums"]["deal_type"];
          seller_company?: string | null;
          buyer_company?: string | null;
          referrer_company?: string | null;
          referred_company?: string | null;
          current_status?: Database["public"]["Enums"]["deal_status"];
          next_action?: string | null;
          scheduled_date?: string | null;
          transfer_price?: number | null;
          retainer_fee?: number | null;
          success_fee?: number | null;
          remarks_internal?: string | null;
          remarks_shared?: string | null;
          share_token?: string | null;
          share_enabled?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          deal_name?: string;
          deal_type?: Database["public"]["Enums"]["deal_type"];
          seller_company?: string | null;
          buyer_company?: string | null;
          referrer_company?: string | null;
          referred_company?: string | null;
          current_status?: Database["public"]["Enums"]["deal_status"];
          next_action?: string | null;
          scheduled_date?: string | null;
          transfer_price?: number | null;
          retainer_fee?: number | null;
          success_fee?: number | null;
          remarks_internal?: string | null;
          remarks_shared?: string | null;
          share_token?: string | null;
          share_enabled?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deal_assignees: {
        Row: {
          deal_id: string;
          user_id: string;
          is_primary: boolean;
        };
        Insert: {
          deal_id: string;
          user_id: string;
          is_primary?: boolean;
        };
        Update: {
          deal_id?: string;
          user_id?: string;
          is_primary?: boolean;
        };
        Relationships: [];
      };
      buyers: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          desired_schemes: Database["public"]["Enums"]["deal_type"][];
          budget_min: number | null;
          budget_max: number | null;
          areas: string[];
          industries: string | null;
          notes: string | null;
          status: Database["public"]["Enums"]["buyer_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          desired_schemes?: Database["public"]["Enums"]["deal_type"][];
          budget_min?: number | null;
          budget_max?: number | null;
          areas?: string[];
          industries?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["buyer_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          desired_schemes?: Database["public"]["Enums"]["deal_type"][];
          budget_min?: number | null;
          budget_max?: number | null;
          areas?: string[];
          industries?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["buyer_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deal_documents: {
        Row: {
          id: string;
          deal_id: string;
          category: Database["public"]["Enums"]["document_category"];
          kind: "file" | "link";
          name: string;
          file_path: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          external_url: string | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          category?: Database["public"]["Enums"]["document_category"];
          kind: "file" | "link";
          name: string;
          file_path?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          external_url?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          category?: Database["public"]["Enums"]["document_category"];
          kind?: "file" | "link";
          name?: string;
          file_path?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          external_url?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      deal_status_history: {
        Row: {
          id: string;
          deal_id: string;
          from_status: Database["public"]["Enums"]["deal_status"] | null;
          to_status: Database["public"]["Enums"]["deal_status"];
          note: string | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          deal_id: string;
          from_status?: Database["public"]["Enums"]["deal_status"] | null;
          to_status: Database["public"]["Enums"]["deal_status"];
          note?: string | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          deal_id?: string;
          from_status?: Database["public"]["Enums"]["deal_status"] | null;
          to_status?: Database["public"]["Enums"]["deal_status"];
          note?: string | null;
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      deal_type: "ma_business" | "interior" | "corporate";
      deal_status:
        | "inquiry"
        | "materials_received"
        | "nda"
        | "meeting_scheduling"
        | "meeting_done"
        | "basic_agreement"
        | "due_diligence"
        | "contract_drafting"
        | "contract_signed"
        | "settlement_prep"
        | "closed_won"
        | "handover"
        | "lost"
        | "on_hold";
      user_role: "admin" | "staff";
      document_category:
        | "summary"
        | "materials"
        | "contract"
        | "financial"
        | "other";
      buyer_status: "active" | "paused" | "closed";
    };
    CompositeTypes: Record<never, never>;
  };
};

/** よく使う行型のエイリアス */
export type DealRow = Database["public"]["Tables"]["deals"]["Row"];
export type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
export type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type DealAssigneeRow =
  Database["public"]["Tables"]["deal_assignees"]["Row"];
export type DealStatusHistoryRow =
  Database["public"]["Tables"]["deal_status_history"]["Row"];
export type DealDocumentRow =
  Database["public"]["Tables"]["deal_documents"]["Row"];
export type BuyerRow = Database["public"]["Tables"]["buyers"]["Row"];
export type BuyerInsert = Database["public"]["Tables"]["buyers"]["Insert"];
export type BuyerUpdate = Database["public"]["Tables"]["buyers"]["Update"];
