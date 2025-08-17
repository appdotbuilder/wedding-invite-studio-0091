import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { rsvpTable, usersTable, templatesTable, projectsTable } from '../db/schema';
import { type CreateRsvpInput } from '../schema';
import { createRsvp } from '../handlers/create_rsvp';
import { eq } from 'drizzle-orm';

describe('createRsvp', () => {
  let testUserId: number;
  let testTemplateId: number;
  let testProjectId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        full_name: 'Test User',
        role: 'user'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "modern"}',
        is_premium: false
      })
      .returning()
      .execute();
    testTemplateId = templateResult[0].id;

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: testUserId,
        template_id: testTemplateId,
        subdomain: 'test-wedding',
        bride_name: 'Jane Doe',
        groom_name: 'John Doe',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Beautiful Gardens',
        venue_address: '123 Garden St, City',
        status: 'draft'
      })
      .returning()
      .execute();
    testProjectId = projectResult[0].id;
  });

  afterEach(resetDB);

  it('should create an RSVP with all required fields', async () => {
    const input: CreateRsvpInput = {
      project_id: testProjectId,
      guest_name: 'Alice Smith',
      guest_email: 'alice@example.com',
      guest_phone: '+1234567890'
    };

    const result = await createRsvp(input);

    // Verify all fields are set correctly
    expect(result.project_id).toEqual(testProjectId);
    expect(result.guest_name).toEqual('Alice Smith');
    expect(result.guest_email).toEqual('alice@example.com');
    expect(result.guest_phone).toEqual('+1234567890');
    expect(result.status).toEqual('maybe');
    expect(result.guest_count).toEqual(1);
    expect(result.message).toBeNull();
    expect(result.responded_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.unique_link).toBeDefined();
    expect(result.unique_link).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
  });

  it('should create an RSVP with minimal fields (nullables)', async () => {
    const input: CreateRsvpInput = {
      project_id: testProjectId,
      guest_name: 'Bob Johnson',
      guest_email: null,
      guest_phone: null
    };

    const result = await createRsvp(input);

    expect(result.project_id).toEqual(testProjectId);
    expect(result.guest_name).toEqual('Bob Johnson');
    expect(result.guest_email).toBeNull();
    expect(result.guest_phone).toBeNull();
    expect(result.status).toEqual('maybe');
    expect(result.guest_count).toEqual(1);
    expect(result.unique_link).toBeDefined();
  });

  it('should save RSVP to database correctly', async () => {
    const input: CreateRsvpInput = {
      project_id: testProjectId,
      guest_name: 'Charlie Brown',
      guest_email: 'charlie@example.com',
      guest_phone: '+9876543210'
    };

    const result = await createRsvp(input);

    // Query database to verify record was saved
    const rsvps = await db.select()
      .from(rsvpTable)
      .where(eq(rsvpTable.id, result.id))
      .execute();

    expect(rsvps).toHaveLength(1);
    const savedRsvp = rsvps[0];
    expect(savedRsvp.project_id).toEqual(testProjectId);
    expect(savedRsvp.guest_name).toEqual('Charlie Brown');
    expect(savedRsvp.guest_email).toEqual('charlie@example.com');
    expect(savedRsvp.guest_phone).toEqual('+9876543210');
    expect(savedRsvp.status).toEqual('maybe');
    expect(savedRsvp.guest_count).toEqual(1);
    expect(savedRsvp.unique_link).toEqual(result.unique_link);
  });

  it('should generate unique links for multiple RSVPs', async () => {
    const input1: CreateRsvpInput = {
      project_id: testProjectId,
      guest_name: 'Guest One',
      guest_email: 'guest1@example.com',
      guest_phone: null
    };

    const input2: CreateRsvpInput = {
      project_id: testProjectId,
      guest_name: 'Guest Two',
      guest_email: 'guest2@example.com',
      guest_phone: null
    };

    const result1 = await createRsvp(input1);
    const result2 = await createRsvp(input2);

    expect(result1.unique_link).toBeDefined();
    expect(result2.unique_link).toBeDefined();
    expect(result1.unique_link).not.toEqual(result2.unique_link);
    
    // Verify both links are stored in database
    const allRsvps = await db.select()
      .from(rsvpTable)
      .execute();

    expect(allRsvps).toHaveLength(2);
    const uniqueLinks = allRsvps.map(r => r.unique_link);
    expect(uniqueLinks).toContain(result1.unique_link);
    expect(uniqueLinks).toContain(result2.unique_link);
  });

  it('should throw error for non-existent project', async () => {
    const input: CreateRsvpInput = {
      project_id: 99999, // Non-existent project ID
      guest_name: 'Test Guest',
      guest_email: 'test@example.com',
      guest_phone: null
    };

    await expect(createRsvp(input)).rejects.toThrow(/project with id 99999 not found/i);
  });

  it('should verify unique link format is secure', async () => {
    const input: CreateRsvpInput = {
      project_id: testProjectId,
      guest_name: 'Security Test Guest',
      guest_email: 'security@example.com',
      guest_phone: null
    };

    const result = await createRsvp(input);

    // Verify link is 64 characters (32 bytes in hex)
    expect(result.unique_link).toHaveLength(64);
    
    // Verify link contains only valid hex characters
    expect(result.unique_link).toMatch(/^[a-f0-9]+$/);
    
    // Verify link is stored correctly in database
    const dbRsvp = await db.select()
      .from(rsvpTable)
      .where(eq(rsvpTable.unique_link, result.unique_link))
      .execute();

    expect(dbRsvp).toHaveLength(1);
    expect(dbRsvp[0].id).toEqual(result.id);
  });

  it('should handle project with published status', async () => {
    // Create a published project
    const publishedProjectResult = await db.insert(projectsTable)
      .values({
        user_id: testUserId,
        template_id: testTemplateId,
        subdomain: 'published-wedding',
        bride_name: 'Published Bride',
        groom_name: 'Published Groom',
        event_date: new Date('2024-07-20'),
        event_time: '16:00',
        venue_name: 'Grand Hall',
        venue_address: '456 Hall Ave, City',
        status: 'published',
        published_at: new Date()
      })
      .returning()
      .execute();

    const input: CreateRsvpInput = {
      project_id: publishedProjectResult[0].id,
      guest_name: 'Published Guest',
      guest_email: 'published@example.com',
      guest_phone: '+1111111111'
    };

    const result = await createRsvp(input);

    expect(result.project_id).toEqual(publishedProjectResult[0].id);
    expect(result.guest_name).toEqual('Published Guest');
    expect(result.status).toEqual('maybe');
  });
});