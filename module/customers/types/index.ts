export interface RepAssignment {
  id: number;
  name: string;
  phone: string;
  company_id: number;
  referral_code: string;
  work_days: string[];
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  assigned_reps_count: number;
  assigned_reps_details: RepAssignment[];
  created_at: string;
  updated_at: string;
}

export interface CustomerStats {
  total_customers: number;
  active_customers: number;
  inactive_customers: number;
}

export interface CustomersListResponse {
  success: boolean;
  data: {
    customers: Customer[];
    total: number;
  };
}

export interface CustomerDetailResponse {
  success: boolean;
  data: {
    customer: Customer;
  };
}

export interface CustomerStatsResponse {
  success: boolean;
  data: CustomerStats;
}

export interface UpdateCustomerLocationRequest {
  latitude: number;
  longitude: number;
}

export interface UpdateCustomerWorkDaysRequest {
  work_days: string[];
}

export interface UpdateCustomerRequest {
  latitude?: number;
  longitude?: number;
  work_days?: string[];
}

export interface UpdateCustomerResponse {
  success: boolean;
  message: string;
  data: {
    customer: Customer;
  };
}

export interface UpdateRepWorkDaysRequest {
  work_days: string[];
}

export interface UpdateRepWorkDaysResponse {
  success: boolean;
  message: string;
  data: {
    profile: {
      id: number;
      name: string;
      work_days: string[];
    };
  };
}
