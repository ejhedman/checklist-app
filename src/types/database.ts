export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          nickname: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_users: {
        Row: {
          team_id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          team_id: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          team_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      releases: {
        Row: {
          id: string
          name: string
          target_date: string
          platform_update: boolean
          config_update: boolean
          state: 'pending' | 'ready' | 'past_due' | 'complete' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          target_date: string
          platform_update?: boolean
          config_update?: boolean
          state?: 'pending' | 'ready' | 'past_due' | 'complete' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          target_date?: string
          platform_update?: boolean
          config_update?: boolean
          state?: 'pending' | 'ready' | 'past_due' | 'complete' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      release_teams: {
        Row: {
          release_id: string
          team_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          release_id: string
          team_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          release_id?: string
          team_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      features: {
        Row: {
          id: string
          release_id: string
          name: string
          jira_ticket: string | null
          description: string | null
          dri_user_id: string
          is_platform: boolean
          is_ready: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          release_id: string
          name: string
          jira_ticket?: string | null
          description?: string | null
          dri_user_id: string
          is_platform?: boolean
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          release_id?: string
          name?: string
          jira_ticket?: string | null
          description?: string | null
          dri_user_id?: string
          is_platform?: boolean
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_release_state: {
        Row: {
          release_id: string
          user_id: string
          is_ready: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          release_id: string
          user_id: string
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          release_id?: string
          user_id?: string
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 