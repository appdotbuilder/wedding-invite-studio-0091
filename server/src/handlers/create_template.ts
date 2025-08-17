import { db } from '../db';
import { templatesTable } from '../db/schema';
import { type CreateTemplateInput, type Template } from '../schema';

export const createTemplate = async (input: CreateTemplateInput): Promise<Template> => {
  try {
    // Validate template_data is valid JSON
    JSON.parse(input.template_data);
    
    // Insert template record
    const result = await db.insert(templatesTable)
      .values({
        name: input.name,
        description: input.description,
        thumbnail_url: input.thumbnail_url,
        template_data: input.template_data,
        is_premium: input.is_premium,
        is_active: true, // Default value
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Template creation failed:', error);
    throw error;
  }
};