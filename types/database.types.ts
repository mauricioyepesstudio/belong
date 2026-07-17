export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ConnectionStatus = "pending" | "accepted" | "declined";
export type CommunityMemberRole = "member" | "admin" | "owner";
export type OrganizationMemberRole = "owner" | "admin" | "manager" | "member" | "guest";
export type ProjectStatus = "planning" | "active" | "completed" | "archived";
export type NotificationType = "connection" | "project" | "event" | "community" | "message" | "system" | "payment";
export type SubscriptionTier = "free" | "pro" | "creator";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid";
export type PaymentType = "platform_subscription" | "community_subscription" | "project_funding" | "donation" | "marketplace_purchase" | "creator_tip";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type ListingStatus = "draft" | "active" | "sold" | "archived";
export type DailyMissionStatus = "pending" | "completed" | "skipped";
export type WeeklyGoalStatus = "active" | "completed" | "expired";
export type QuarterlyGoalStatus = "active" | "completed" | "expired";
export type ImpactEventModule = "mission" | "community" | "project" | "organization" | "system";
export type ImpactEventType =
  | "mission_completed"
  | "weekly_goal_completed"
  | "quarterly_goal_completed"
  | "community_join"
  | "community_post"
  | "community_comment"
  | "community_like"
  | "project_created"
  | "project_join"
  | "project_post"
  | "project_comment"
  | "project_completed"
  | "project_task_created"
  | "project_task_completed"
  | "project_file_uploaded"
  | "project_goal_completed"
  | "project_milestone_completed"
  | "organization_created"
  | "organization_join"
  | "organization_invite_accepted"
  | "streak_activity"
  | "connection_accepted";
export type ProjectTaskStatus = "todo" | "in_progress" | "review" | "done";
export type ProjectTaskPriority = "low" | "medium" | "high" | "urgent";
export type ProjectGoalType = "weekly" | "quarterly";
export type ProjectGoalStatus = "active" | "completed" | "expired";
export type OnboardingSessionStatus = "in_progress" | "completed" | "abandoned";
export type MissionState =
  | "draft"
  | "discovering"
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type BuildGoal =
  | "startup"
  | "career"
  | "learn"
  | "health"
  | "relationships"
  | "community"
  | "travel"
  | "creator";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          location: string | null;
          bio: string | null;
          build_goal: BuildGoal | null;
          build_vision: string | null;
          onboarding_completed: boolean;
          stripe_customer_id: string | null;
          subscription_tier: SubscriptionTier;
          stripe_connect_account_id: string | null;
          connect_charges_enabled: boolean;
          connect_payouts_enabled: boolean;
          founder_reputation: number;
          community_contribution_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          location?: string | null;
          bio?: string | null;
          build_goal?: BuildGoal | null;
          build_vision?: string | null;
          onboarding_completed?: boolean;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          stripe_connect_account_id?: string | null;
          connect_charges_enabled?: boolean;
          connect_payouts_enabled?: boolean;
          founder_reputation?: number;
          community_contribution_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          location?: string | null;
          bio?: string | null;
          build_goal?: BuildGoal | null;
          build_vision?: string | null;
          onboarding_completed?: boolean;
          stripe_customer_id?: string | null;
          subscription_tier?: SubscriptionTier;
          stripe_connect_account_id?: string | null;
          connect_charges_enabled?: boolean;
          connect_payouts_enabled?: boolean;
          founder_reputation?: number;
          community_contribution_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      missions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          is_primary: boolean;
          state: MissionState;
          vision: string | null;
          category: string | null;
          activated_at: string | null;
          completed_at: string | null;
          archived_at: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          is_primary?: boolean;
          state?: MissionState;
          vision?: string | null;
          category?: string | null;
          activated_at?: string | null;
          completed_at?: string | null;
          archived_at?: string | null;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          is_primary?: boolean;
          state?: MissionState;
          vision?: string | null;
          category?: string | null;
          activated_at?: string | null;
          completed_at?: string | null;
          archived_at?: string | null;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_milestones: {
        Row: {
          id: string;
          mission_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          mission_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string;
          title?: string;
          description?: string | null;
          target_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: ConnectionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          recipient_id: string;
          status?: ConnectionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          recipient_id?: string;
          status?: ConnectionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          owner_id: string;
          impact_score: number;
          reputation_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          owner_id: string;
          impact_score?: number;
          reputation_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          owner_id?: string;
          impact_score?: number;
          reputation_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationMemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrganizationMemberRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrganizationMemberRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          tag: string | null;
          owner_id: string;
          organization_id: string;
          is_paid: boolean;
          subscription_price_cents: number | null;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          tag?: string | null;
          owner_id: string;
          organization_id: string;
          is_paid?: boolean;
          subscription_price_cents?: number | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          tag?: string | null;
          owner_id?: string;
          organization_id?: string;
          is_paid?: boolean;
          subscription_price_cents?: number | null;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: CommunityMemberRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: CommunityMemberRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          user_id?: string;
          role?: CommunityMemberRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: ProjectStatus;
          progress: number;
          deadline: string | null;
          owner_id: string;
          community_id: string;
          funding_enabled: boolean;
          funding_goal_cents: number | null;
          funding_raised_cents: number;
          mission_id: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          progress?: number;
          deadline?: string | null;
          owner_id: string;
          community_id: string;
          funding_enabled?: boolean;
          funding_goal_cents?: number | null;
          funding_raised_cents?: number;
          mission_id?: string | null;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          progress?: number;
          deadline?: string | null;
          owner_id?: string;
          community_id?: string;
          funding_enabled?: boolean;
          funding_goal_cents?: number | null;
          funding_raised_cents?: number;
          mission_id?: string | null;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          project_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          community_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          community_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          community_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_registrations: {
        Row: {
          event_id: string;
          user_id: string;
          registered_at: string;
        };
        Insert: {
          event_id: string;
          user_id: string;
          registered_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          registered_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversation_participants: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          subscription_type: string;
          status: SubscriptionStatus;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          community_id: string | null;
          price_cents: number | null;
          currency: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_type: string;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          community_id?: string | null;
          price_cents?: number | null;
          currency?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_type?: string;
          status?: SubscriptionStatus;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          community_id?: string | null;
          price_cents?: number | null;
          currency?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          payer_id: string;
          recipient_id: string | null;
          payment_type: PaymentType;
          status: PaymentStatus;
          amount_cents: number;
          currency: string;
          platform_fee_cents: number;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payer_id: string;
          recipient_id?: string | null;
          payment_type: PaymentType;
          status?: PaymentStatus;
          amount_cents: number;
          currency?: string;
          platform_fee_cents?: number;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payer_id?: string;
          recipient_id?: string | null;
          payment_type?: PaymentType;
          status?: PaymentStatus;
          amount_cents?: number;
          currency?: string;
          platform_fee_cents?: number;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketplace_listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string | null;
          price_cents: number;
          currency: string;
          stripe_price_id: string | null;
          stripe_product_id: string | null;
          image_url: string | null;
          status: ListingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string | null;
          price_cents: number;
          currency?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          image_url?: string | null;
          status?: ListingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          stripe_price_id?: string | null;
          stripe_product_id?: string | null;
          image_url?: string | null;
          status?: ListingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: {
          id: string;
          event_type: string;
          processed_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          type: NotificationType;
          read_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          type?: NotificationType;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          type?: NotificationType;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_momentum: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_active_date: string | null;
          weekly_completions: number;
          week_start: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          weekly_completions?: number;
          week_start?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_active_date?: string | null;
          weekly_completions?: number;
          week_start?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_missions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          action_href: string;
          impact_points: number;
          status: DailyMissionStatus;
          mission_date: string;
          completed_at: string | null;
          sort_order: number;
          mission_id: string | null;
          weekly_goal_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          action_href?: string;
          impact_points?: number;
          status?: DailyMissionStatus;
          mission_date?: string;
          completed_at?: string | null;
          sort_order?: number;
          mission_id?: string | null;
          weekly_goal_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          action_href?: string;
          impact_points?: number;
          status?: DailyMissionStatus;
          mission_date?: string;
          completed_at?: string | null;
          sort_order?: number;
          mission_id?: string | null;
          weekly_goal_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_mission_participants: {
        Row: {
          id: string;
          daily_mission_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          daily_mission_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          daily_mission_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      weekly_goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_count: number;
          current_count: number;
          action_href: string;
          impact_points: number;
          status: WeeklyGoalStatus;
          week_start: string;
          week_end: string;
          completed_at: string | null;
          mission_id: string | null;
          quarterly_goal_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_count?: number;
          current_count?: number;
          action_href?: string;
          impact_points?: number;
          status?: WeeklyGoalStatus;
          week_start: string;
          week_end: string;
          completed_at?: string | null;
          mission_id?: string | null;
          quarterly_goal_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          target_count?: number;
          current_count?: number;
          action_href?: string;
          impact_points?: number;
          status?: WeeklyGoalStatus;
          week_start?: string;
          week_end?: string;
          completed_at?: string | null;
          mission_id?: string | null;
          quarterly_goal_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quarterly_goals: {
        Row: {
          id: string;
          user_id: string;
          mission_id: string;
          title: string;
          description: string | null;
          progress_percent: number;
          due_date: string;
          status: QuarterlyGoalStatus;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_id: string;
          title: string;
          description?: string | null;
          progress_percent?: number;
          due_date: string;
          status?: QuarterlyGoalStatus;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mission_id?: string;
          title?: string;
          description?: string | null;
          progress_percent?: number;
          due_date?: string;
          status?: QuarterlyGoalStatus;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      impact_snapshots: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          recorded_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score: number;
          recorded_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score?: number;
          recorded_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_skills: {
        Row: {
          id: string;
          user_id: string;
          skill: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      identity_profiles: {
        Row: {
          user_id: string;
          strengths: string[];
          interests: string[];
          values: string[];
          personality: Json;
          experience: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          strengths?: string[];
          interests?: string[];
          values?: string[];
          personality?: Json;
          experience?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          strengths?: string[];
          interests?: string[];
          values?: string[];
          personality?: Json;
          experience?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      onboarding_sessions: {
        Row: {
          user_id: string;
          current_step: string;
          draft: Json;
          status: OnboardingSessionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_step?: string;
          draft?: Json;
          status?: OnboardingSessionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_step?: string;
          draft?: Json;
          status?: OnboardingSessionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_contributions: {
        Row: {
          id: string;
          user_id: string;
          community_id: string;
          contribution_type: string;
          points: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          community_id: string;
          contribution_type: string;
          points?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          community_id?: string;
          contribution_type?: string;
          points?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_posts: {
        Row: {
          id: string;
          community_id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      community_post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      community_post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_posts: {
        Row: {
          id: string;
          project_id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      project_post_comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          id: string;
          project_id: string;
          creator_id: string;
          assignee_id: string | null;
          title: string;
          description: string | null;
          status: ProjectTaskStatus;
          priority: ProjectTaskPriority;
          deadline: string | null;
          sort_order: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          creator_id: string;
          assignee_id?: string | null;
          title: string;
          description?: string | null;
          status?: ProjectTaskStatus;
          priority?: ProjectTaskPriority;
          deadline?: string | null;
          sort_order?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          creator_id?: string;
          assignee_id?: string | null;
          title?: string;
          description?: string | null;
          status?: ProjectTaskStatus;
          priority?: ProjectTaskPriority;
          deadline?: string | null;
          sort_order?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          target_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          uploader_id: string;
          file_name: string;
          storage_path: string;
          file_size: number;
          mime_type: string | null;
          version: number;
          parent_file_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          uploader_id: string;
          file_name: string;
          storage_path: string;
          file_size?: number;
          mime_type?: string | null;
          version?: number;
          parent_file_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          uploader_id?: string;
          file_name?: string;
          storage_path?: string;
          file_size?: number;
          mime_type?: string | null;
          version?: number;
          parent_file_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_discussions: {
        Row: {
          id: string;
          project_id: string;
          author_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          author_id: string;
          title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_discussion_replies: {
        Row: {
          id: string;
          discussion_id: string;
          author_id: string;
          parent_reply_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          author_id: string;
          parent_reply_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          author_id?: string;
          parent_reply_id?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      project_goals: {
        Row: {
          id: string;
          project_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          goal_type: ProjectGoalType;
          progress_percent: number;
          due_date: string | null;
          status: ProjectGoalStatus;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          goal_type?: ProjectGoalType;
          progress_percent?: number;
          due_date?: string | null;
          status?: ProjectGoalStatus;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          goal_type?: ProjectGoalType;
          progress_percent?: number;
          due_date?: string | null;
          status?: ProjectGoalStatus;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      project_activity: {
        Row: {
          id: string;
          project_id: string;
          actor_id: string | null;
          activity_type: string;
          title: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          actor_id?: string | null;
          activity_type: string;
          title: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          actor_id?: string | null;
          activity_type?: string;
          title?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      impact_events: {
        Row: {
          id: string;
          user_id: string;
          module: ImpactEventModule;
          event_type: ImpactEventType;
          points: number;
          source_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          module: ImpactEventModule;
          event_type: ImpactEventType;
          points?: number;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          module?: ImpactEventModule;
          event_type?: ImpactEventType;
          points?: number;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_notification: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_body: string;
          p_type?: NotificationType;
          p_metadata?: Json;
        };
        Returns: string;
      };
      increment_project_funding: {
        Args: {
          p_project_id: string;
          p_amount_cents: number;
        };
        Returns: undefined;
      };
      record_user_activity: {
        Args: {
          p_user_id: string;
        };
        Returns: Database["public"]["Tables"]["user_momentum"]["Row"];
      };
    };
    Enums: {
      connection_status: ConnectionStatus;
      community_member_role: CommunityMemberRole;
      project_status: ProjectStatus;
      notification_type: NotificationType;
      build_goal: BuildGoal;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      payment_type: PaymentType;
      payment_status: PaymentStatus;
      listing_status: ListingStatus;
      daily_mission_status: DailyMissionStatus;
      weekly_goal_status: WeeklyGoalStatus;
      quarterly_goal_status: QuarterlyGoalStatus;
      impact_event_module: ImpactEventModule;
      impact_event_type: ImpactEventType;
      mission_state: MissionState;
      onboarding_session_status: OnboardingSessionStatus;
    };
  };
}

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type Mission = Database["public"]["Tables"]["missions"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
export type CommunityPostLike = Database["public"]["Tables"]["community_post_likes"]["Row"];
export type CommunityPostComment = Database["public"]["Tables"]["community_post_comments"]["Row"];
export type ProjectPost = Database["public"]["Tables"]["project_posts"]["Row"];
export type ProjectPostComment = Database["public"]["Tables"]["project_post_comments"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type MarketplaceListing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
export type ImpactEventRow = Database["public"]["Tables"]["impact_events"]["Row"];
