import { db } from '../db';
import { rsvpTable, projectsTable } from '../db/schema';
import { type CreateRsvpInput, type Rsvp } from '../schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const createRsvp = async (input: CreateRsvpInput): Promise<Rsvp> => {
  try {
    // Check if project exists
    const project = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    if (project.length === 0) {
      throw new Error(`Project with ID ${input.project_id} not found`);
    }

    // Generate a secure unique link
    const generateUniqueLink = (): string => {
      return randomBytes(32).toString('hex');
    };

    let uniqueLink: string;
    let isLinkUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure the generated link is truly unique
    while (!isLinkUnique && attempts < maxAttempts) {
      uniqueLink = generateUniqueLink();
      
      const existingRsvp = await db.select()
        .from(rsvpTable)
        .where(eq(rsvpTable.unique_link, uniqueLink))
        .execute();

      if (existingRsvp.length === 0) {
        isLinkUnique = true;
      }
      attempts++;
    }

    if (!isLinkUnique) {
      throw new Error('Failed to generate unique RSVP link after multiple attempts');
    }

    // Insert RSVP record
    const result = await db.insert(rsvpTable)
      .values({
        project_id: input.project_id,
        guest_name: input.guest_name,
        guest_email: input.guest_email,
        guest_phone: input.guest_phone,
        status: 'maybe', // Default status until guest responds
        guest_count: 1, // Default guest count
        message: null,
        unique_link: uniqueLink!,
        responded_at: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('RSVP creation failed:', error);
    throw error;
  }
};