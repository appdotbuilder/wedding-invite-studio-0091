import { db } from '../db';
import { projectsTable, usersTable, templatesTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Validate that the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with ID ${input.user_id} does not exist`);
    }

    // Validate that the template exists
    const templateExists = await db.select({ id: templatesTable.id })
      .from(templatesTable)
      .where(eq(templatesTable.id, input.template_id))
      .limit(1)
      .execute();

    if (templateExists.length === 0) {
      throw new Error(`Template with ID ${input.template_id} does not exist`);
    }

    // Validate that the reseller exists if provided
    if (input.reseller_id) {
      const resellerExists = await db.select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, input.reseller_id))
        .limit(1)
        .execute();

      if (resellerExists.length === 0) {
        throw new Error(`Reseller with ID ${input.reseller_id} does not exist`);
      }

      if (resellerExists[0].role !== 'reseller') {
        throw new Error(`User with ID ${input.reseller_id} is not a reseller`);
      }
    }

    // Check if subdomain is already taken
    const subdomainExists = await db.select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.subdomain, input.subdomain))
      .limit(1)
      .execute();

    if (subdomainExists.length > 0) {
      throw new Error(`Subdomain '${input.subdomain}' is already taken`);
    }

    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        user_id: input.user_id,
        reseller_id: input.reseller_id,
        template_id: input.template_id,
        subdomain: input.subdomain,
        bride_name: input.bride_name,
        groom_name: input.groom_name,
        event_date: input.event_date,
        event_time: input.event_time,
        venue_name: input.venue_name,
        venue_address: input.venue_address,
        venue_latitude: input.venue_latitude?.toString(),
        venue_longitude: input.venue_longitude?.toString(),
        hero_photo_url: input.hero_photo_url,
        additional_info: input.additional_info,
        custom_data: input.custom_data,
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const project = result[0];
    return {
      ...project,
      venue_latitude: project.venue_latitude ? parseFloat(project.venue_latitude) : null,
      venue_longitude: project.venue_longitude ? parseFloat(project.venue_longitude) : null,
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};