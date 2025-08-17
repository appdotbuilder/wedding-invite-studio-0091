import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjects = async (userId: number, userRole: string): Promise<Project[]> => {
  try {
    let results;

    // Apply role-based filtering with separate queries
    if (userRole === 'user') {
      // Users can only see their own projects
      results = await db.select()
        .from(projectsTable)
        .where(eq(projectsTable.user_id, userId))
        .execute();
    } else if (userRole === 'reseller') {
      // Resellers can only see projects where they are the reseller
      results = await db.select()
        .from(projectsTable)
        .where(eq(projectsTable.reseller_id, userId))
        .execute();
    } else {
      // Admin users see all projects (no additional filtering)
      results = await db.select()
        .from(projectsTable)
        .execute();
    }

    // Convert numeric fields back to numbers
    return results.map(project => ({
      ...project,
      venue_latitude: project.venue_latitude ? parseFloat(project.venue_latitude) : null,
      venue_longitude: project.venue_longitude ? parseFloat(project.venue_longitude) : null,
    }));
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
};