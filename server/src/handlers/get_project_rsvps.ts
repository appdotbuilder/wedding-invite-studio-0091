import { db } from '../db';
import { rsvpTable } from '../db/schema';
import { type Rsvp } from '../schema';
import { eq } from 'drizzle-orm';

export const getProjectRsvps = async (projectId: number): Promise<Rsvp[]> => {
  try {
    // Query all RSVP entries for the specific project
    const results = await db.select()
      .from(rsvpTable)
      .where(eq(rsvpTable.project_id, projectId))
      .execute();

    // Return the results as-is since no numeric conversions are needed
    // All fields in RSVP table are already in the correct types
    return results;
  } catch (error) {
    console.error('Get project RSVPs failed:', error);
    throw error;
  }
};