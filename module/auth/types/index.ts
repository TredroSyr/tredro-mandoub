// types.ts
export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  currency: string;
  is_active: boolean;
  logo: string | null;
  cover: string | null;
  governorate: string | null;
  region: string | null;
  description: string | null;
  business_type: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Rep {
  id: number;
  name: string;
  phone: string;
  referral_code: string;
  is_active: boolean;
  work_days: string[];
  company: Company;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface AuthResponseData {
  rep: Rep;
  tokens: Tokens;
}

export interface AuthApiResponse {
  success: boolean;
  message: string;
  data: AuthResponseData;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
