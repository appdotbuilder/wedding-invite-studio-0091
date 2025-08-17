import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['admin', 'reseller', 'user']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string(),
  role: userRoleSchema,
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for user login
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Template schema
export const templateSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail_url: z.string(),
  template_data: z.string(), // JSON string containing template structure
  is_active: z.boolean(),
  is_premium: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Template = z.infer<typeof templateSchema>;

// Input schema for creating templates
export const createTemplateInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  thumbnail_url: z.string(),
  template_data: z.string(),
  is_premium: z.boolean(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

// Project status enum
export const projectStatusSchema = z.enum(['draft', 'published', 'archived']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  reseller_id: z.number().nullable(),
  template_id: z.number(),
  subdomain: z.string(),
  bride_name: z.string(),
  groom_name: z.string(),
  event_date: z.coerce.date(),
  event_time: z.string(),
  venue_name: z.string(),
  venue_address: z.string(),
  venue_latitude: z.number().nullable(),
  venue_longitude: z.number().nullable(),
  hero_photo_url: z.string().nullable(),
  additional_info: z.string().nullable(),
  custom_data: z.string().nullable(), // JSON string for additional customization
  status: projectStatusSchema,
  is_paid: z.boolean(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Project = z.infer<typeof projectSchema>;

// Input schema for creating projects
export const createProjectInputSchema = z.object({
  user_id: z.number(),
  reseller_id: z.number().nullable(),
  template_id: z.number(),
  subdomain: z.string().min(3).max(50),
  bride_name: z.string(),
  groom_name: z.string(),
  event_date: z.coerce.date(),
  event_time: z.string(),
  venue_name: z.string(),
  venue_address: z.string(),
  venue_latitude: z.number().nullable(),
  venue_longitude: z.number().nullable(),
  hero_photo_url: z.string().nullable(),
  additional_info: z.string().nullable(),
  custom_data: z.string().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

// Input schema for updating projects
export const updateProjectInputSchema = z.object({
  id: z.number(),
  bride_name: z.string().optional(),
  groom_name: z.string().optional(),
  event_date: z.coerce.date().optional(),
  event_time: z.string().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  venue_latitude: z.number().nullable().optional(),
  venue_longitude: z.number().nullable().optional(),
  hero_photo_url: z.string().nullable().optional(),
  additional_info: z.string().nullable().optional(),
  custom_data: z.string().nullable().optional(),
  status: projectStatusSchema.optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// RSVP status enum
export const rsvpStatusSchema = z.enum(['yes', 'no', 'maybe']);
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>;

// RSVP schema
export const rsvpSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  guest_name: z.string(),
  guest_email: z.string().email().nullable(),
  guest_phone: z.string().nullable(),
  status: rsvpStatusSchema,
  guest_count: z.number().int().nonnegative(),
  message: z.string().nullable(),
  unique_link: z.string(),
  responded_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});

export type Rsvp = z.infer<typeof rsvpSchema>;

// Input schema for creating RSVP
export const createRsvpInputSchema = z.object({
  project_id: z.number(),
  guest_name: z.string(),
  guest_email: z.string().email().nullable(),
  guest_phone: z.string().nullable(),
});

export type CreateRsvpInput = z.infer<typeof createRsvpInputSchema>;

// Input schema for responding to RSVP
export const respondRsvpInputSchema = z.object({
  unique_link: z.string(),
  status: rsvpStatusSchema,
  guest_count: z.number().int().nonnegative(),
  message: z.string().nullable(),
});

export type RespondRsvpInput = z.infer<typeof respondRsvpInputSchema>;

// Payment status enum
export const paymentStatusSchema = z.enum(['pending', 'paid', 'failed', 'refunded']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// Payment schema
export const paymentSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  user_id: z.number(),
  amount: z.number(),
  currency: z.string(),
  payment_method: z.string().nullable(),
  payment_gateway: z.string(), // midtrans, xendit, etc.
  gateway_payment_id: z.string().nullable(),
  gateway_response: z.string().nullable(), // JSON string
  status: paymentStatusSchema,
  paid_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Payment = z.infer<typeof paymentSchema>;

// Input schema for creating payments
export const createPaymentInputSchema = z.object({
  project_id: z.number(),
  user_id: z.number(),
  amount: z.number().positive(),
  currency: z.string().length(3), // ISO currency code
  payment_gateway: z.string(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Plan schema
export const planSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  currency: z.string(),
  features: z.string(), // JSON string containing plan features
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Plan = z.infer<typeof planSchema>;

// Input schema for creating plans
export const createPlanInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nonnegative(),
  currency: z.string().length(3),
  features: z.string(),
});

export type CreatePlanInput = z.infer<typeof createPlanInputSchema>;

// Reseller earnings schema
export const resellerEarningSchema = z.object({
  id: z.number(),
  reseller_id: z.number(),
  project_id: z.number(),
  payment_id: z.number(),
  commission_rate: z.number(),
  commission_amount: z.number(),
  earned_at: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type ResellerEarning = z.infer<typeof resellerEarningSchema>;

// Input schema for subdomain check
export const checkSubdomainInputSchema = z.object({
  subdomain: z.string().min(3).max(50),
});

export type CheckSubdomainInput = z.infer<typeof checkSubdomainInputSchema>;

// Response schema for subdomain check
export const subdomainCheckResponseSchema = z.object({
  available: z.boolean(),
  subdomain: z.string(),
});

export type SubdomainCheckResponse = z.infer<typeof subdomainCheckResponseSchema>;