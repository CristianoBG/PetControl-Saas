export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: string | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      atividades: {
        Row: {
          created_at: string
          descricao: string
          id: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          assistente_ativo: boolean
          created_at: string
          dias_aviso_antecipado: number
          id: string
          logo_url: string | null
          nome_petshop: string
          nome_usuario: string | null
          tema_cor: string
          template_mensagem: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          assistente_ativo?: boolean
          created_at?: string
          dias_aviso_antecipado?: number
          id?: string
          logo_url?: string | null
          nome_petshop?: string
          nome_usuario?: string | null
          tema_cor?: string
          template_mensagem?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          assistente_ativo?: boolean
          created_at?: string
          dias_aviso_antecipado?: number
          id?: string
          logo_url?: string | null
          nome_petshop?: string
          nome_usuario?: string | null
          tema_cor?: string
          template_mensagem?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      estoque: {
        Row: {
          categoria: string | null
          codigo_barras: string | null
          created_at: string
          data_validade: string
          foto_url: string | null
          id: string
          lote: string | null
          nome_produto: string
          preco_unitario: number | null
          quantidade: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string
          data_validade: string
          foto_url?: string | null
          id?: string
          lote?: string | null
          nome_produto: string
          preco_unitario?: number | null
          quantidade?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string
          data_validade?: string
          foto_url?: string | null
          id?: string
          lote?: string | null
          nome_produto?: string
          preco_unitario?: number | null
          quantidade?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      historico_mensagens: {
        Row: {
          enviado_em: string
          id: string
          mensagem_enviada: string
          nome_dono: string
          nome_pet: string
          tipo_vacina: string
          user_id: string
          vacina_id: string | null
        }
        Insert: {
          enviado_em?: string
          id?: string
          mensagem_enviada: string
          nome_dono: string
          nome_pet: string
          tipo_vacina: string
          user_id: string
          vacina_id?: string | null
        }
        Update: {
          enviado_em?: string
          id?: string
          mensagem_enviada?: string
          nome_dono?: string
          nome_pet?: string
          tipo_vacina?: string
          user_id?: string
          vacina_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_mensagens_vacina_id_fkey"
            columns: ["vacina_id"]
            isOneToOne: false
            referencedRelation: "vacinas"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          codigo_barras: string | null
          created_at: string
          id: string
          origem: string
          produto_nome: string
          quantidade: number
          tipo: string
          user_id: string
        }
        Insert: {
          codigo_barras?: string | null
          created_at?: string
          id?: string
          origem?: string
          produto_nome: string
          quantidade: number
          tipo: string
          user_id: string
        }
        Update: {
          codigo_barras?: string | null
          created_at?: string
          id?: string
          origem?: string
          produto_nome?: string
          quantidade?: number
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          billing_cycle: string | null
          created_at: string
          customer_email: string
          id: string
          klivopay_data: Json | null
          plan_type: string
          status: string
          transaction_hash: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          billing_cycle?: string | null
          created_at?: string
          customer_email: string
          id?: string
          klivopay_data?: Json | null
          plan_type: string
          status?: string
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          billing_cycle?: string | null
          created_at?: string
          customer_email?: string
          id?: string
          klivopay_data?: Json | null
          plan_type?: string
          status?: string
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      perdas: {
        Row: {
          data_validade: string
          id: string
          lote: string | null
          nome_produto: string
          preco_unitario: number | null
          removido_em: string
          user_id: string
        }
        Insert: {
          data_validade: string
          id?: string
          lote?: string | null
          nome_produto: string
          preco_unitario?: number | null
          removido_em?: string
          user_id: string
        }
        Update: {
          data_validade?: string
          id?: string
          lote?: string | null
          nome_produto?: string
          preco_unitario?: number | null
          removido_em?: string
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          created_at: string
          dono_nome: string
          foto_url: string | null
          id: string
          nome: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dono_nome: string
          foto_url?: string | null
          id?: string
          nome: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dono_nome?: string
          foto_url?: string | null
          id?: string
          nome?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos_catalogo: {
        Row: {
          codigo_barras: string
          created_at: string
          id: string
          nome_produto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo_barras: string
          created_at?: string
          id?: string
          nome_produto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo_barras?: string
          created_at?: string
          id?: string
          nome_produto?: string
          updated_at?: string
          user_id?: string
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
      user_subscriptions: {
        Row: {
          billing_cycle: string | null
          created_at: string
          id: string
          plan_type: string
          product_limit: number | null
          subscription_expires_at: string | null
          subscription_status: string
          trial_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          id?: string
          plan_type?: string
          product_limit?: number | null
          subscription_expires_at?: string | null
          subscription_status?: string
          trial_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          id?: string
          plan_type?: string
          product_limit?: number | null
          subscription_expires_at?: string | null
          subscription_status?: string
          trial_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vacinas: {
        Row: {
          aplicada: boolean
          avisado: boolean
          created_at: string
          data_aplicacao: string | null
          data_dose: string
          data_proxima_dose: string | null
          foto_pet_url: string | null
          id: string
          lote_aplicacao: string | null
          nome_dono: string
          nome_pet: string
          observacao_aplicacao: string | null
          pet_id: string | null
          tipo_vacina: string
          updated_at: string
          user_id: string
          whatsapp_dono: string
        }
        Insert: {
          aplicada?: boolean
          avisado?: boolean
          created_at?: string
          data_aplicacao?: string | null
          data_dose: string
          data_proxima_dose?: string | null
          foto_pet_url?: string | null
          id?: string
          lote_aplicacao?: string | null
          nome_dono: string
          nome_pet: string
          observacao_aplicacao?: string | null
          pet_id?: string | null
          tipo_vacina: string
          updated_at?: string
          user_id: string
          whatsapp_dono: string
        }
        Update: {
          aplicada?: boolean
          avisado?: boolean
          created_at?: string
          data_aplicacao?: string | null
          data_dose?: string
          data_proxima_dose?: string | null
          foto_pet_url?: string | null
          id?: string
          lote_aplicacao?: string | null
          nome_dono?: string
          nome_pet?: string
          observacao_aplicacao?: string | null
          pet_id?: string | null
          tipo_vacina?: string
          updated_at?: string
          user_id?: string
          whatsapp_dono?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacinas_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_change_plan: {
        Args: { new_limit: number; new_plan: string; target_user: string }
        Returns: undefined
      }
      admin_delete_user: { Args: { target_user: string }; Returns: undefined }
      admin_force_activate: {
        Args: { target_user: string }
        Returns: undefined
      }
      admin_get_metrics: { Args: never; Returns: Json }
      admin_get_user_dashboard: { Args: { target_user: string }; Returns: Json }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      admin_reset_user_data: {
        Args: { target_user: string }
        Returns: undefined
      }
      apply_vaccine_and_schedule: {
        Args: {
          p_agendar_dias?: number
          p_data_aplicacao: string
          p_lote?: string
          p_observacao?: string
          p_vacina_id: string
        }
        Returns: string
      }
      downgrade_expired_subscriptions: { Args: never; Returns: number }
      get_dashboard_chart: {
        Args: { p_user_id: string; p_year?: number }
        Returns: Json
      }
      get_dashboard_stats: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

