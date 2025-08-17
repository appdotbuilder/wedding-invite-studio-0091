import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, usersTable, templatesTable } from '../db/schema';
import { type UpdateProjectInput, type CreateProjectInput } from '../schema';
import { updateProject } from '../handlers/update_project';
import { eq } from 'drizzle-orm';

describe('updateProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let templateId: number;
  let projectId: number;

  beforeEach(async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();
    
    userId = userResult[0].id;

    // Create a test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: JSON.stringify({ layout: 'basic' }),
        is_premium: false,
      })
      .returning()
      .execute();
    
    templateId = templateResult[0].id;

    // Create a test project
    const projectData: CreateProjectInput = {
      user_id: userId,
      reseller_id: null,
      template_id: templateId,
      subdomain: 'test-wedding',
      bride_name: 'Jane Doe',
      groom_name: 'John Smith',
      event_date: new Date('2024-06-15'),
      event_time: '18:00',
      venue_name: 'Grand Hotel',
      venue_address: '123 Main St, City',
      venue_latitude: 40.7128,
      venue_longitude: -74.0060,
      hero_photo_url: 'https://example.com/hero.jpg',
      additional_info: 'Special instructions',
      custom_data: JSON.stringify({ theme: 'romantic' }),
    };

    const projectResult = await db.insert(projectsTable)
      .values({
        ...projectData,
        venue_latitude: projectData.venue_latitude?.toString(),
        venue_longitude: projectData.venue_longitude?.toString(),
      })
      .returning()
      .execute();
    
    projectId = projectResult[0].id;
  });

  it('should update basic project fields', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      bride_name: 'Jane Updated',
      groom_name: 'John Updated',
      event_time: '19:30',
      venue_name: 'Updated Venue',
    };

    const result = await updateProject(updateInput);

    expect(result.id).toEqual(projectId);
    expect(result.bride_name).toEqual('Jane Updated');
    expect(result.groom_name).toEqual('John Updated');
    expect(result.event_time).toEqual('19:30');
    expect(result.venue_name).toEqual('Updated Venue');
    
    // Check that other fields remain unchanged
    expect(result.venue_address).toEqual('123 Main St, City');
    expect(result.subdomain).toEqual('test-wedding');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update numeric coordinates', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      venue_latitude: 51.5074,
      venue_longitude: -0.1278,
    };

    const result = await updateProject(updateInput);

    expect(result.venue_latitude).toEqual(51.5074);
    expect(result.venue_longitude).toEqual(-0.1278);
    expect(typeof result.venue_latitude).toEqual('number');
    expect(typeof result.venue_longitude).toEqual('number');
  });

  it('should handle null coordinate values', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      venue_latitude: null,
      venue_longitude: null,
    };

    const result = await updateProject(updateInput);

    expect(result.venue_latitude).toBeNull();
    expect(result.venue_longitude).toBeNull();
  });

  it('should update event date correctly', async () => {
    const newDate = new Date('2024-12-25');
    const updateInput: UpdateProjectInput = {
      id: projectId,
      event_date: newDate,
    };

    const result = await updateProject(updateInput);

    expect(result.event_date).toBeInstanceOf(Date);
    expect(result.event_date.getTime()).toEqual(newDate.getTime());
  });

  it('should update optional nullable fields', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      hero_photo_url: 'https://example.com/new-hero.jpg',
      additional_info: 'Updated special instructions',
      custom_data: JSON.stringify({ theme: 'modern', color: 'blue' }),
    };

    const result = await updateProject(updateInput);

    expect(result.hero_photo_url).toEqual('https://example.com/new-hero.jpg');
    expect(result.additional_info).toEqual('Updated special instructions');
    expect(result.custom_data).toEqual(JSON.stringify({ theme: 'modern', color: 'blue' }));
  });

  it('should set nullable fields to null when provided', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      hero_photo_url: null,
      additional_info: null,
      custom_data: null,
    };

    const result = await updateProject(updateInput);

    expect(result.hero_photo_url).toBeNull();
    expect(result.additional_info).toBeNull();
    expect(result.custom_data).toBeNull();
  });

  it('should update status and set published_at when publishing', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      status: 'published',
    };

    const result = await updateProject(updateInput);

    expect(result.status).toEqual('published');
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });

  it('should update status without affecting published_at for non-published statuses', async () => {
    // First publish the project
    await updateProject({
      id: projectId,
      status: 'published',
    });

    // Then change to archived
    const updateInput: UpdateProjectInput = {
      id: projectId,
      status: 'archived',
    };

    const result = await updateProject(updateInput);

    expect(result.status).toEqual('archived');
    expect(result.published_at).toBeInstanceOf(Date); // Should remain set from previous publish
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      bride_name: 'Database Test Bride',
      venue_name: 'Database Test Venue',
    };

    await updateProject(updateInput);

    // Query database directly to verify persistence
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, projectId))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].bride_name).toEqual('Database Test Bride');
    expect(projects[0].venue_name).toEqual('Database Test Venue');
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent project', async () => {
    const updateInput: UpdateProjectInput = {
      id: 99999, // Non-existent ID
      bride_name: 'Should Fail',
    };

    await expect(updateProject(updateInput)).rejects.toThrow(/Project with id 99999 not found/);
  });

  it('should update only provided fields and leave others unchanged', async () => {
    const updateInput: UpdateProjectInput = {
      id: projectId,
      bride_name: 'Only Bride Updated',
    };

    const result = await updateProject(updateInput);

    expect(result.bride_name).toEqual('Only Bride Updated');
    // All other fields should remain the same
    expect(result.groom_name).toEqual('John Smith');
    expect(result.venue_name).toEqual('Grand Hotel');
    expect(result.venue_address).toEqual('123 Main St, City');
    expect(result.event_time).toEqual('18:00');
    expect(result.status).toEqual('draft');
  });

  it('should handle complete project update with all fields', async () => {
    const newDate = new Date('2025-01-01');
    const updateInput: UpdateProjectInput = {
      id: projectId,
      bride_name: 'Complete Update Bride',
      groom_name: 'Complete Update Groom',
      event_date: newDate,
      event_time: '20:00',
      venue_name: 'Complete Update Venue',
      venue_address: '456 Updated St',
      venue_latitude: 35.6762,
      venue_longitude: 139.6503,
      hero_photo_url: 'https://example.com/complete-hero.jpg',
      additional_info: 'Complete update info',
      custom_data: JSON.stringify({ complete: 'update' }),
      status: 'published',
    };

    const result = await updateProject(updateInput);

    expect(result.bride_name).toEqual('Complete Update Bride');
    expect(result.groom_name).toEqual('Complete Update Groom');
    expect(result.event_date.getTime()).toEqual(newDate.getTime());
    expect(result.event_time).toEqual('20:00');
    expect(result.venue_name).toEqual('Complete Update Venue');
    expect(result.venue_address).toEqual('456 Updated St');
    expect(result.venue_latitude).toEqual(35.6762);
    expect(result.venue_longitude).toEqual(139.6503);
    expect(result.hero_photo_url).toEqual('https://example.com/complete-hero.jpg');
    expect(result.additional_info).toEqual('Complete update info');
    expect(result.custom_data).toEqual(JSON.stringify({ complete: 'update' }));
    expect(result.status).toEqual('published');
    expect(result.published_at).toBeInstanceOf(Date);
  });
});