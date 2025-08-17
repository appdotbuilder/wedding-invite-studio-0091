import { db } from '../db';
import { rsvpTable } from '../db/schema';
import { type RespondRsvpInput, type Rsvp } from '../schema';
import { eq } from 'drizzle-orm';

export const respondRsvp = async (input: RespondRsvpInput): Promise<Rsvp> => {
  try {
    // Update RSVP record by unique_link
    const result = await db.update(rsvpTable)
      .set({
        status: input.status,
        guest_count: input.guest_count,
        message: input.message,
        responded_at: new Date()
      })
      .where(eq(rsvpTable.unique_link, input.unique_link))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('RSVP not found with the provided unique link');
    }

    return result[0];
  } catch (error) {
    console.error('RSVP response failed:', error);
    throw error;
  }
};