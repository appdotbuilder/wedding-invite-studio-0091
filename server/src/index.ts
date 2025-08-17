import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createTemplateInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  checkSubdomainInputSchema,
  createRsvpInputSchema,
  respondRsvpInputSchema,
  createPaymentInputSchema,
  createPlanInputSchema,
  paymentStatusSchema,
  userRoleSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { login } from './handlers/login';
import { getTemplates } from './handlers/get_templates';
import { createTemplate } from './handlers/create_template';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProjectBySubdomain } from './handlers/get_project_by_subdomain';
import { updateProject } from './handlers/update_project';
import { checkSubdomain } from './handlers/check_subdomain';
import { createRsvp } from './handlers/create_rsvp';
import { respondRsvp } from './handlers/respond_rsvp';
import { getProjectRsvps } from './handlers/get_project_rsvps';
import { createPayment } from './handlers/create_payment';
import { updatePaymentStatus } from './handlers/update_payment_status';
import { getPlans } from './handlers/get_plans';
import { createPlan } from './handlers/create_plan';
import { getResellerEarnings } from './handlers/get_reseller_earnings';
import { getAdminStats } from './handlers/get_admin_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Template routes
  getTemplates: publicProcedure
    .query(() => getTemplates()),

  createTemplate: publicProcedure
    .input(createTemplateInputSchema)
    .mutation(({ input }) => createTemplate(input)),

  // Project routes
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),

  getProjects: publicProcedure
    .input(z.object({ 
      userId: z.number(),
      userRole: userRoleSchema
    }))
    .query(({ input }) => getProjects(input.userId, input.userRole)),

  getProjectBySubdomain: publicProcedure
    .input(z.object({ subdomain: z.string() }))
    .query(({ input }) => getProjectBySubdomain(input.subdomain)),

  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),

  // Subdomain management
  checkSubdomain: publicProcedure
    .input(checkSubdomainInputSchema)
    .query(({ input }) => checkSubdomain(input)),

  // RSVP routes
  createRsvp: publicProcedure
    .input(createRsvpInputSchema)
    .mutation(({ input }) => createRsvp(input)),

  respondRsvp: publicProcedure
    .input(respondRsvpInputSchema)
    .mutation(({ input }) => respondRsvp(input)),

  getProjectRsvps: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getProjectRsvps(input.projectId)),

  // Payment routes
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),

  updatePaymentStatus: publicProcedure
    .input(z.object({
      gatewayPaymentId: z.string(),
      status: paymentStatusSchema,
      gatewayResponse: z.string().optional()
    }))
    .mutation(({ input }) => updatePaymentStatus(
      input.gatewayPaymentId,
      input.status,
      input.gatewayResponse
    )),

  // Plan routes
  getPlans: publicProcedure
    .query(() => getPlans()),

  createPlan: publicProcedure
    .input(createPlanInputSchema)
    .mutation(({ input }) => createPlan(input)),

  // Reseller routes
  getResellerEarnings: publicProcedure
    .input(z.object({ resellerId: z.number() }))
    .query(({ input }) => getResellerEarnings(input.resellerId)),

  // Admin routes
  getAdminStats: publicProcedure
    .query(() => getAdminStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Wedding Invite Studio tRPC server listening at port: ${port}`);
}

start();