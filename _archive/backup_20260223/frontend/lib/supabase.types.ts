export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      broker_connections: {
        Row: {
          broker_type: string
          created_at: string | null
          credentials: Json
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker_type: string
          created_at?: string | null
          credentials: Json
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker_type?: string
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      ea_artifacts: {
        Row: {
          artifact_type: string
          checksum: string | null
          created_at: string | null
          ea_version_id: string
          file_size: number | null
          id: string
          storage_path: string
        }
        Insert: {
          artifact_type: string
          checksum?: string | null
          created_at?: string | null
          ea_version_id: string
          file_size?: number | null
          id?: string
          storage_path: string
        }
        Update: {
          artifact_type?: string
          checksum?: string | null
          created_at?: string | null
          ea_version_id?: string
          file_size?: number | null
          id?: string
          storage_path?: string
        }
      }
      ea_deployments: {
        Row: {
          created_at: string | null
          deployed_at: string | null
          ea_version_id: string
          error_message: string | null
          id: string
          mt5_agent_id: string | null
          runtime_config: Json | null
          status: string | null
          stopped_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deployed_at?: string | null
          ea_version_id: string
          error_message?: string | null
          id?: string
          mt5_agent_id?: string | null
          runtime_config?: Json | null
          status?: string | null
          stopped_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deployed_at?: string | null
          ea_version_id?: string
          error_message?: string | null
          id?: string
          mt5_agent_id?: string | null
          runtime_config?: Json | null
          status?: string | null
          stopped_at?: string | null
          updated_at?: string | null
        }
      }
      ea_projects: {
        Row: {
          created_at: string | null
          default_settings: Json | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_settings?: Json | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_settings?: Json | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      ea_versions: {
        Row: {
          compilation_error: string | null
          config: Json | null
          created_at: string | null
          ea_project_id: string
          id: string
          source_code: Json
          status: string | null
          updated_at: string | null
          version_number: number
        }
        Insert: {
          compilation_error?: string | null
          config?: Json | null
          created_at?: string | null
          ea_project_id: string
          id?: string
          source_code: Json
          status?: string | null
          updated_at?: string | null
          version_number: number
        }
        Update: {
          compilation_error?: string | null
          config?: Json | null
          created_at?: string | null
          ea_project_id?: string
          id?: string
          source_code?: Json
          status?: string | null
          updated_at?: string | null
          version_number?: number
        }
      }
      instrument_config: {
        Row: {
          contract_size: number | null
          created_at: string | null
          is_active: boolean | null
          margin_currency: string | null
          max_lot_size: number | null
          min_lot_size: number | null
          pair: string
          pip_size: number | null
          pip_value: number | null
          swap_long: number | null
          swap_short: number | null
          trading_hours: string | null
          updated_at: string | null
        }
        Insert: {
          contract_size?: number | null
          created_at?: string | null
          is_active?: boolean | null
          margin_currency?: string | null
          max_lot_size?: number | null
          min_lot_size?: number | null
          pair: string
          pip_size?: number | null
          pip_value?: number | null
          swap_long?: number | null
          swap_short?: number | null
          trading_hours?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_size?: number | null
          created_at?: string | null
          is_active?: boolean | null
          margin_currency?: string | null
          max_lot_size?: number | null
          min_lot_size?: number | null
          pair?: string
          pip_size?: number | null
          pip_value?: number | null
          swap_long?: number | null
          swap_short?: number | null
          trading_hours?: string | null
          updated_at?: string | null
        }
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
      mt5_agents: {
        Row: {
          agent_name: string
          broker_connection_id: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_heartbeat: string | null
          login: string
          password_encrypted: string
          terminal_server: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          broker_connection_id?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_heartbeat?: string | null
          login: string
          password_encrypted: string
          terminal_server: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          broker_connection_id?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_heartbeat?: string | null
          login?: string
          password_encrypted?: string
          terminal_server?: string
          updated_at?: string | null
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          max_daily_loss: number | null
          max_position_size: number | null
          onboarding_complete: boolean | null
          risk_tolerance: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          max_daily_loss?: number | null
          max_position_size?: number | null
          onboarding_complete?: boolean | null
          risk_tolerance?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          max_daily_loss?: number | null
          max_position_size?: number | null
          onboarding_complete?: boolean | null
          risk_tolerance?: string | null
          updated_at?: string | null
        }
      }
      trade_events: {
        Row: {
          broker_connection_id: string | null
          created_at: string | null
          direction: string | null
          entry_price: number | null
          event_type: string
          exit_price: number | null
          external_order_id: string | null
          external_position_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          pair: string | null
          profit_loss: number | null
          quantity: number | null
          sl: number | null
          tp: number | null
          user_id: string
        }
        Insert: {
          broker_connection_id?: string | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          event_type: string
          exit_price?: number | null
          external_order_id?: string | null
          external_position_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          pair?: string | null
          profit_loss?: number | null
          quantity?: number | null
          sl?: number | null
          tp?: number | null
          user_id: string
        }
        Update: {
          broker_connection_id?: string | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          event_type?: string
          exit_price?: number | null
          external_order_id?: string | null
          external_position_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          pair?: string | null
          profit_loss?: number | null
          quantity?: number | null
          sl?: number | null
          tp?: number | null
          user_id?: string
        }
      }
    }
  }
}