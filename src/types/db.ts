export type UserRole = "athlete" | "buyer" | "admin";
export type GigStatus = "draft" | "active" | "paused";
export type PackageTier = "basic" | "standard" | "premium";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";
export type AcademicYear =
  | "freshman"
  | "sophomore"
  | "junior"
  | "senior"
  | "graduate";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  school: string | null;
  sport: string | null;
  position: string | null;
  jersey_number: number | null;
  academic_year: AcademicYear | null;
  graduation_year: number | null;
  nil_eligible: boolean | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_tiktok: string | null;
  rating: number | null;
  total_reviews: number | null;
  total_earnings_cents: number | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
};

export type Gig = {
  id: string;
  athlete_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[];
  status: GigStatus;
  views: number;
  rating: number;
  total_reviews: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
};

export type GigPackage = {
  id: string;
  gig_id: string;
  tier: PackageTier;
  title: string;
  description: string | null;
  price_cents: number;
  delivery_days: number;
  revisions: number;
  features: string[];
};

export type Order = {
  id: string;
  buyer_id: string;
  athlete_id: string;
  gig_id: string;
  package_id: string;
  status: OrderStatus;
  requirements: string | null;
  total_cents: number;
  due_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  body: string;
  attachment_url: string | null;
  read_at: string | null;
  created_at: string;
};

export type Review = {
  id: string;
  order_id: string;
  buyer_id: string;
  athlete_id: string;
  gig_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};
