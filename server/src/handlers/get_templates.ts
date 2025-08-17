import { db } from '../db';
import { templatesTable } from '../db/schema';
import { type Template } from '../schema';
import { eq } from 'drizzle-orm';

export const getTemplates = async (): Promise<Template[]> => {
  try {
    // Fetch all active templates from the database
    const results = await db.select()
      .from(templatesTable)
      .where(eq(templatesTable.is_active, true))
      .execute();

    // Return templates (no numeric conversions needed for this schema)
    return results;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw error;
  }
};