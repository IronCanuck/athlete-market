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
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type VerificationMethod =
  | "edu_email"
  | "roster_link"
  | "id_card"
  | "nil_letter"
  | "coach_reference";
export type AthleticDivision =
  | "NCAA_D1"
  | "NCAA_D2"
  | "NCAA_D3"
  | "NAIA"
  | "JUCO"
  | "HS"
  | "CLUB"
  | "PROFESSIONAL";
export type PortfolioType = "image" | "video" | "link" | "document";

export const DIVISION_LABELS: Record<AthleticDivision, string> = {
  NCAA_D1: "NCAA Division I",
  NCAA_D2: "NCAA Division II",
  NCAA_D3: "NCAA Division III",
  NAIA: "NAIA",
  JUCO: "JUCO / NJCAA",
  HS: "High School",
  CLUB: "Club",
  PROFESSIONAL: "Professional",
};

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
  verification_status: VerificationStatus;
  verified_at: string | null;
  division: AthleticDivision | null;
  conference: string | null;
  team_name: string | null;
  school_city: string | null;
  school_state: string | null;
  portfolio_count: number | null;
  created_at: string;
  updated_at: string;
};

export type AthleteSport = {
  id: string;
  athlete_id: string;
  sport: string;
  position: string | null;
  is_primary: boolean;
  jersey_number: number | null;
  years_played: number | null;
  created_at: string;
};

export type PortfolioItem = {
  id: string;
  athlete_id: string;
  type: PortfolioType;
  url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  position: number;
  created_at: string;
};

export type Verification = {
  id: string;
  athlete_id: string;
  method: VerificationMethod;
  proof_url: string | null;
  proof_data: Record<string, unknown> | null;
  status: VerificationStatus;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
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
