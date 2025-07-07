export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string
          member_id: string
          email: string
          full_name: string
          nickname: string | null
          role: 'user' | 'release_manager' | 'admin' | 'superuser'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id?: string
          email: string
          full_name: string
          nickname?: string | null
          role?: 'user' | 'release_manager' | 'admin' | 'superuser'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          email?: string
          full_name?: string
          nickname?: string | null
          role?: 'user' | 'release_manager' | 'admin' | 'superuser'
          created_at?: string
          updated_at?: string
        }
      }
      uroles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user'
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
      team_members: {
        Row: {
          team_id: string
          member_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          team_id: string
          member_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          team_id?: string
          member_id?: string
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
          release_notes: string | null
          release_summary: string | null
          is_archived: boolean
          targets: string[]
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
          release_notes?: string | null
          release_summary?: string | null
          is_archived?: boolean
          targets?: string[]
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
          release_notes?: string | null
          release_summary?: string | null
          is_archived?: boolean
          targets?: string[]
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
          dri_member_id: string | null
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
          dri_member_id?: string | null
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
          dri_member_id?: string | null
          is_platform?: boolean
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      member_release_state: {
        Row: {
          release_id: string
          member_id: string
          is_ready: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          release_id: string
          member_id: string
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          release_id?: string
          member_id?: string
          is_ready?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      targets: {
        Row: {
          id: string
          short_name: string
          name: string
          is_live: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          short_name: string
          name: string
          is_live?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          short_name?: string
          name?: string
          is_live?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          release_id: string | null
          feature_id: string | null
          team_id: string | null
          member_id: string | null
          activity_type: string
          activity_details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          release_id?: string | null
          feature_id?: string | null
          team_id?: string | null
          member_id?: string | null
          activity_type: string
          activity_details?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          release_id?: string | null
          feature_id?: string | null
          team_id?: string | null
          member_id?: string | null
          activity_type?: string
          activity_details?: any | null
          created_at?: string
        }
      }
    }
  }
} 