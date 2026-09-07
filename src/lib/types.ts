// Type des tables Supabase (client)

export type Group = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  created_by: string | null;
  member_count?: number;
};

export type Membership = {
  id: string;
  user_id: string;
  group_id: string;
  joined_at: string;
};

export type Checkin = {
  id: string;
  user_id: string;
  group_id: string;
  check_date: string;
  checked_at: string;
};

// Vue membre dans une page groupe (avec streak calculé)
export type GroupMember = {
  user_id: string;
  display_name: string | null;
  streak: number;
  checked_today: boolean;
};

export type Badge = {
  id: number;
  name: string;
  days_required: number;
  icon: string | null;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: number;
  earned_at: string;
};
