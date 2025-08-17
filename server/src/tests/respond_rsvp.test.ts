import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable, rsvpTable } from '../db/schema';
import { type RespondRsvpInput } from '../schema';
import { respondRsvp } from '../handlers/respond_rsvp';
import { eq } from 'drizzle-orm';

describe('respondRsvp', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testRsvpId: number;
  let testUniqueLink: string;

  beforeEach(async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user'
      })
      .returning()
      .execute();

    const template = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"components": []}',
        is_premium: false
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        user_id: user[0].id,
        template_id: template[0].id,
        subdomain: 'test-wedding',
        bride_name: 'Jane',
        groom_name: 'John',
        event_date: new Date('2024-12-31'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St'
      })
      .returning()
      .execute();

    // Create test RSVP
    testUniqueLink = 'unique-test-link-123';
    const rsvp = await db.insert(rsvpTable)
      .values({
        project_id: project[0].id,
        guest_name: 'Test Guest',
        guest_email: 'guest@example.com',
        guest_phone: '+1234567890',
        status: 'maybe',
        guest_count: 1,
        message: null,
        unique_link: testUniqueLink
      })
      .returning()
      .execute();

    testRsvpId = rsvp[0].id;
  });

  it('should update RSVP response with valid unique link', async () => {
    const input: RespondRsvpInput = {
      unique_link: testUniqueLink,
      status: 'yes',
      guest_count: 2,
      message: 'Looking forward to it!'
    };

    const result = await respondRsvp(input);

    // Verify returned data
    expect(result.id).toBe(testRsvpId);
    expect(result.status).toBe('yes');
    expect(result.guest_count).toBe(2);
    expect(result.message).toBe('Looking forward to it!');
    expect(result.responded_at).toBeInstanceOf(Date);
    expect(result.unique_link).toBe(testUniqueLink);
  });

  it('should save RSVP response to database', async () => {
    const input: RespondRsvpInput = {
      unique_link: testUniqueLink,
      status: 'no',
      guest_count: 0,
      message: 'Sorry, cannot attend'
    };

    await respondRsvp(input);

    // Verify database update
    const updatedRsvp = await db.select()
      .from(rsvpTable)
      .where(eq(rsvpTable.id, testRsvpId))
      .execute();

    expect(updatedRsvp).toHaveLength(1);
    expect(updatedRsvp[0].status).toBe('no');
    expect(updatedRsvp[0].guest_count).toBe(0);
    expect(updatedRsvp[0].message).toBe('Sorry, cannot attend');
    expect(updatedRsvp[0].responded_at).toBeInstanceOf(Date);
  });

  it('should handle RSVP response with null message', async () => {
    const input: RespondRsvpInput = {
      unique_link: testUniqueLink,
      status: 'yes',
      guest_count: 1,
      message: null
    };

    const result = await respondRsvp(input);

    expect(result.status).toBe('yes');
    expect(result.guest_count).toBe(1);
    expect(result.message).toBeNull();
  });

  it('should throw error for non-existent unique link', async () => {
    const input: RespondRsvpInput = {
      unique_link: 'non-existent-link',
      status: 'yes',
      guest_count: 1,
      message: null
    };

    await expect(respondRsvp(input)).rejects.toThrow(/RSVP not found/i);
  });

  it('should update responded_at timestamp', async () => {
    const beforeTime = new Date();
    
    const input: RespondRsvpInput = {
      unique_link: testUniqueLink,
      status: 'maybe',
      guest_count: 3,
      message: 'Will try to make it'
    };

    const result = await respondRsvp(input);
    const afterTime = new Date();

    expect(result.responded_at).toBeInstanceOf(Date);
    expect(result.responded_at!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(result.responded_at!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should handle multiple status updates correctly', async () => {
    // First response
    const firstInput: RespondRsvpInput = {
      unique_link: testUniqueLink,
      status: 'yes',
      guest_count: 2,
      message: 'Will be there!'
    };

    await respondRsvp(firstInput);

    // Second response (changing mind)
    const secondInput: RespondRsvpInput = {
      unique_link: testUniqueLink,
      status: 'no',
      guest_count: 0,
      message: 'Plans changed, sorry'
    };

    const result = await respondRsvp(secondInput);

    // Verify final state
    expect(result.status).toBe('no');
    expect(result.guest_count).toBe(0);
    expect(result.message).toBe('Plans changed, sorry');

    // Verify database state
    const dbRsvp = await db.select()
      .from(rsvpTable)
      .where(eq(rsvpTable.id, testRsvpId))
      .execute();

    expect(dbRsvp[0].status).toBe('no');
    expect(dbRsvp[0].guest_count).toBe(0);
    expect(dbRsvp[0].message).toBe('Plans changed, sorry');
  });
});