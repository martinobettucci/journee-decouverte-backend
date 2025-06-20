export interface Event {
  id: string;
  occasion: string;
  date: string;
  location: string;
  description: string;
  people: Record<string, any>;
  created_at?: string;
}

export interface EventPhoto {
  id: string;
  event_id: string;
  src: string;
  alt: string;
  order: number;
  created_at?: string;
}

export interface WorkshopPassword {
  id: string;
  date: string;
  password: string;
  available_tools: Record<string, boolean>;
  created_at?: string;
}

export interface WorkshopTrainer {
  id: string;
  workshop_date: string;
  trainer_code: string;
  is_claimed: boolean;
  code_sent: boolean;
  is_abandoned: boolean;
  created_at?: string;
  trainer_registrations?: TrainerRegistration[];
}

export interface TrainerRegistration {
  id: string;
  workshop_date: string;
  trainer_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  privacy_policy_accepted: boolean;
  image_consent_accepted: boolean;
  professional_compliance_accepted: boolean;
  event_guidelines_accepted: boolean;
  volunteer_attestation_accepted: boolean;
  contract_accepted: boolean; // New field for contract acceptance
  invoice_file_url: string; // For paid contracts: invoice PDF, for volunteer contracts: motivation letter PDF or placeholder
  rib_file_url: string;
  registered_at?: string;
  // Contract-related fields
  company_name?: string;
  company_legal_form?: string;
  company_capital?: string;
  company_rcs?: string;
  company_rcs_number?: string;
  company_address?: string;
  company_short_name?: string;
  representative_name?: string;
  representative_function?: string;
  representative_email?: string;
}

export interface WorkshopGuidelines {
  workshop_date: string;
  guidelines_markdown: string;
  created_at?: string;
}

export interface ContractTemplate {
  id: string;
  workshop_date: string;
  name: string;
  content_markdown: string;
  type: 'trainer' | 'client';
  is_volunteer: boolean;
  created_at?: string;
}

export interface ContractAssignment {
  id: string;
  trainer_id: string;
  contract_template_id: string;
  created_at?: string;
  workshop_trainers?: WorkshopTrainer;
}

export interface ClientContract {
  id: string;
  workshop_date: string;
  contract_template_id: string;
  client_company_name: string;
  client_representative_name: string;
  client_address: string;
  client_email: string;
  client_company_registration: string;
  signature_code: string;
  is_signed: boolean;
  code_sent: boolean;
  signed_at?: string;
  created_at?: string;
}

export interface WorkshopWithStatus extends WorkshopPassword {
  client_contract?: ClientContract;
  trainer_status?: {
    total_trainers: number;
    registered_trainers: number;
    all_claimed: boolean;
  };
}

export interface Testimonial {
  id: string;
  partner_name: string;
  logo_url: string;
  quote: string;
  rating: number;
  order: number;
  created_at?: string;
}

export interface InitiativeSocialLink {
  url: string;
  type: string;
  label: string;
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  image_url: string;
  logo_url: string;
  website_url: string;
  locations: string[];
  start_date: string;
  specializations: string[];
  social_links: InitiativeSocialLink[];
  created_at?: string;
}