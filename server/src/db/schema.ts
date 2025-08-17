import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'reseller', 'user']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'published', 'archived']);
export const rsvpStatusEnum = pgEnum('rsvp_status', ['yes', 'no', 'maybe']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Templates table
export const templatesTable = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  thumbnail_url: text('thumbnail_url').notNull(),
  template_data: text('template_data').notNull(), // JSON string
  is_active: boolean('is_active').notNull().default(true),
  is_premium: boolean('is_premium').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  reseller_id: integer('reseller_id'),
  template_id: integer('template_id').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  bride_name: text('bride_name').notNull(),
  groom_name: text('groom_name').notNull(),
  event_date: timestamp('event_date').notNull(),
  event_time: text('event_time').notNull(),
  venue_name: text('venue_name').notNull(),
  venue_address: text('venue_address').notNull(),
  venue_latitude: numeric('venue_latitude', { precision: 10, scale: 8 }),
  venue_longitude: numeric('venue_longitude', { precision: 11, scale: 8 }),
  hero_photo_url: text('hero_photo_url'),
  additional_info: text('additional_info'),
  custom_data: text('custom_data'), // JSON string
  status: projectStatusEnum('status').notNull().default('draft'),
  is_paid: boolean('is_paid').notNull().default(false),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// RSVP table
export const rsvpTable = pgTable('rsvp', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull(),
  guest_name: text('guest_name').notNull(),
  guest_email: text('guest_email'),
  guest_phone: text('guest_phone'),
  status: rsvpStatusEnum('status').notNull(),
  guest_count: integer('guest_count').notNull().default(1),
  message: text('message'),
  unique_link: text('unique_link').notNull().unique(),
  responded_at: timestamp('responded_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull(),
  user_id: integer('user_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  payment_method: text('payment_method'),
  payment_gateway: text('payment_gateway').notNull(),
  gateway_payment_id: text('gateway_payment_id'),
  gateway_response: text('gateway_response'), // JSON string
  status: paymentStatusEnum('status').notNull().default('pending'),
  paid_at: timestamp('paid_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Plans table
export const plansTable = pgTable('plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  features: text('features').notNull(), // JSON string
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Reseller earnings table
export const resellerEarningsTable = pgTable('reseller_earnings', {
  id: serial('id').primaryKey(),
  reseller_id: integer('reseller_id').notNull(),
  project_id: integer('project_id').notNull(),
  payment_id: integer('payment_id').notNull(),
  commission_rate: numeric('commission_rate', { precision: 5, scale: 4 }).notNull(),
  commission_amount: numeric('commission_amount', { precision: 10, scale: 2 }).notNull(),
  earned_at: timestamp('earned_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  projects: many(projectsTable),
  resellerProjects: many(projectsTable, { relationName: 'resellerProjects' }),
  payments: many(paymentsTable),
  earnings: many(resellerEarningsTable),
}));

export const templatesRelations = relations(templatesTable, ({ many }) => ({
  projects: many(projectsTable),
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [projectsTable.user_id],
    references: [usersTable.id],
  }),
  reseller: one(usersTable, {
    fields: [projectsTable.reseller_id],
    references: [usersTable.id],
    relationName: 'resellerProjects',
  }),
  template: one(templatesTable, {
    fields: [projectsTable.template_id],
    references: [templatesTable.id],
  }),
  rsvps: many(rsvpTable),
  payments: many(paymentsTable),
  earnings: many(resellerEarningsTable),
}));

export const rsvpRelations = relations(rsvpTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [rsvpTable.project_id],
    references: [projectsTable.id],
  }),
}));

export const paymentsRelations = relations(paymentsTable, ({ one, many }) => ({
  project: one(projectsTable, {
    fields: [paymentsTable.project_id],
    references: [projectsTable.id],
  }),
  user: one(usersTable, {
    fields: [paymentsTable.user_id],
    references: [usersTable.id],
  }),
  earnings: many(resellerEarningsTable),
}));

export const resellerEarningsRelations = relations(resellerEarningsTable, ({ one }) => ({
  reseller: one(usersTable, {
    fields: [resellerEarningsTable.reseller_id],
    references: [usersTable.id],
  }),
  project: one(projectsTable, {
    fields: [resellerEarningsTable.project_id],
    references: [projectsTable.id],
  }),
  payment: one(paymentsTable, {
    fields: [resellerEarningsTable.payment_id],
    references: [paymentsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Template = typeof templatesTable.$inferSelect;
export type NewTemplate = typeof templatesTable.$inferInsert;
export type Project = typeof projectsTable.$inferSelect;
export type NewProject = typeof projectsTable.$inferInsert;
export type Rsvp = typeof rsvpTable.$inferSelect;
export type NewRsvp = typeof rsvpTable.$inferInsert;
export type Payment = typeof paymentsTable.$inferSelect;
export type NewPayment = typeof paymentsTable.$inferInsert;
export type Plan = typeof plansTable.$inferSelect;
export type NewPlan = typeof plansTable.$inferInsert;
export type ResellerEarning = typeof resellerEarningsTable.$inferSelect;
export type NewResellerEarning = typeof resellerEarningsTable.$inferInsert;

// Export all tables for proper relation queries
export const tables = {
  users: usersTable,
  templates: templatesTable,
  projects: projectsTable,
  rsvp: rsvpTable,
  payments: paymentsTable,
  plans: plansTable,
  resellerEarnings: resellerEarningsTable,
};