import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type UpdateProjectInput, type Project } from '../schema';
import { eq } from 'drizzle-orm';

export const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
  try {
    // Build the update object dynamically based on provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    // Add fields that are present in the input
    if (input.bride_name !== undefined) {
      updateData['bride_name'] = input.bride_name;
    }
    if (input.groom_name !== undefined) {
      updateData['groom_name'] = input.groom_name;
    }
    if (input.event_date !== undefined) {
      updateData['event_date'] = input.event_date;
    }
    if (input.event_time !== undefined) {
      updateData['event_time'] = input.event_time;
    }
    if (input.venue_name !== undefined) {
      updateData['venue_name'] = input.venue_name;
    }
    if (input.venue_address !== undefined) {
      updateData['venue_address'] = input.venue_address;
    }
    if (input.venue_latitude !== undefined) {
      updateData['venue_latitude'] = input.venue_latitude === null ? null : input.venue_latitude.toString();
    }
    if (input.venue_longitude !== undefined) {
      updateData['venue_longitude'] = input.venue_longitude === null ? null : input.venue_longitude.toString();
    }
    if (input.hero_photo_url !== undefined) {
      updateData['hero_photo_url'] = input.hero_photo_url;
    }
    if (input.additional_info !== undefined) {
      updateData['additional_info'] = input.additional_info;
    }
    if (input.custom_data !== undefined) {
      updateData['custom_data'] = input.custom_data;
    }
    if (input.status !== undefined) {
      updateData['status'] = input.status;
      
      // Set published_at when status changes to 'published'
      if (input.status === 'published') {
        updateData['published_at'] = new Date();
      }
    }

    // Update the project
    const result = await db.update(projectsTable)
      .set(updateData)
      .where(eq(projectsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Project with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const project = result[0];
    return {
      ...project,
      venue_latitude: project.venue_latitude ? parseFloat(project.venue_latitude) : null,
      venue_longitude: project.venue_longitude ? parseFloat(project.venue_longitude) : null
    };
  } catch (error) {
    console.error('Project update failed:', error);
    throw error;
  }
};