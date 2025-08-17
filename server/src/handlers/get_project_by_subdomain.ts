import { db } from '../db';
import { projectsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type Project } from '../schema';

export const getProjectBySubdomain = async (subdomain: string): Promise<Project | null> => {
  try {
    // Query for a published project with the given subdomain
    const result = await db.select()
      .from(projectsTable)
      .where(and(
        eq(projectsTable.subdomain, subdomain),
        eq(projectsTable.status, 'published')
      ))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const project = result[0];
    
    // Convert numeric fields back to numbers for the response
    return {
      ...project,
      venue_latitude: project.venue_latitude ? parseFloat(project.venue_latitude) : null,
      venue_longitude: project.venue_longitude ? parseFloat(project.venue_longitude) : null,
    };
  } catch (error) {
    console.error('Failed to get project by subdomain:', error);
    throw error;
  }
};