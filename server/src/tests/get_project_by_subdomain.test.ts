import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable } from '../db/schema';
import { getProjectBySubdomain } from '../handlers/get_project_by_subdomain';

// Test data
const testUser = {
  email: 'user@example.com',
  password_hash: 'hashed_password',
  full_name: 'Test User',
  role: 'user' as const,
};

const testTemplate = {
  name: 'Test Template',
  description: 'A template for testing',
  thumbnail_url: 'https://example.com/thumb.jpg',
  template_data: '{"theme": "classic"}',
  is_premium: false,
};

const testProject = {
  subdomain: 'john-jane-wedding',
  bride_name: 'Jane Doe',
  groom_name: 'John Smith',
  event_date: new Date('2024-06-15'),
  event_time: '15:00',
  venue_name: 'Grand Ballroom',
  venue_address: '123 Wedding St, City, State',
  venue_latitude: '40.7128',
  venue_longitude: '-74.0060',
  hero_photo_url: 'https://example.com/hero.jpg',
  additional_info: 'Additional wedding information',
  custom_data: '{"color": "gold"}',
  status: 'published' as const,
  is_paid: true,
};

describe('getProjectBySubdomain', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return published project by subdomain', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create published project
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
      })
      .execute();

    const result = await getProjectBySubdomain('john-jane-wedding');

    expect(result).not.toBeNull();
    expect(result!.subdomain).toEqual('john-jane-wedding');
    expect(result!.bride_name).toEqual('Jane Doe');
    expect(result!.groom_name).toEqual('John Smith');
    expect(result!.status).toEqual('published');
    expect(result!.venue_name).toEqual('Grand Ballroom');
    expect(result!.venue_address).toEqual('123 Wedding St, City, State');
    expect(result!.hero_photo_url).toEqual('https://example.com/hero.jpg');
    expect(result!.additional_info).toEqual('Additional wedding information');
    expect(result!.custom_data).toEqual('{"color": "gold"}');
    expect(result!.is_paid).toEqual(true);
    expect(result!.event_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should convert numeric venue coordinates correctly', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create published project with coordinates
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
      })
      .execute();

    const result = await getProjectBySubdomain('john-jane-wedding');

    expect(result).not.toBeNull();
    expect(typeof result!.venue_latitude).toBe('number');
    expect(typeof result!.venue_longitude).toBe('number');
    expect(result!.venue_latitude).toEqual(40.7128);
    expect(result!.venue_longitude).toEqual(-74.0060);
  });

  it('should handle null venue coordinates', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create published project without coordinates
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
        venue_latitude: null,
        venue_longitude: null,
      })
      .execute();

    const result = await getProjectBySubdomain('john-jane-wedding');

    expect(result).not.toBeNull();
    expect(result!.venue_latitude).toBeNull();
    expect(result!.venue_longitude).toBeNull();
  });

  it('should return null for non-existent subdomain', async () => {
    const result = await getProjectBySubdomain('non-existent-subdomain');
    expect(result).toBeNull();
  });

  it('should return null for draft project', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create draft project
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
        status: 'draft',
      })
      .execute();

    const result = await getProjectBySubdomain('john-jane-wedding');
    expect(result).toBeNull();
  });

  it('should return null for archived project', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create archived project
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
        status: 'archived',
      })
      .execute();

    const result = await getProjectBySubdomain('john-jane-wedding');
    expect(result).toBeNull();
  });

  it('should only return published projects when multiple exist', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create draft project first
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
        subdomain: 'test-wedding-draft',
        status: 'draft',
      })
      .execute();

    // Create published project
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
        subdomain: 'test-wedding-published',
        status: 'published',
      })
      .execute();

    // Should return null for draft project
    const draftResult = await getProjectBySubdomain('test-wedding-draft');
    expect(draftResult).toBeNull();

    // Should return published project
    const publishedResult = await getProjectBySubdomain('test-wedding-published');
    expect(publishedResult).not.toBeNull();
    expect(publishedResult!.status).toEqual('published');
  });

  it('should handle special characters in subdomain', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create template
    const [template] = await db.insert(templatesTable)
      .values(testTemplate)
      .returning()
      .execute();

    // Create published project with special characters in subdomain
    await db.insert(projectsTable)
      .values({
        ...testProject,
        user_id: user.id,
        template_id: template.id,
        subdomain: 'maria-jose-2024',
      })
      .execute();

    const result = await getProjectBySubdomain('maria-jose-2024');

    expect(result).not.toBeNull();
    expect(result!.subdomain).toEqual('maria-jose-2024');
    expect(result!.status).toEqual('published');
  });
});