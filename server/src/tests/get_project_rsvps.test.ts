import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable, rsvpTable } from '../db/schema';
import { getProjectRsvps } from '../handlers/get_project_rsvps';

describe('getProjectRsvps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for project with no RSVPs', async () => {
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

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "simple"}',
        is_premium: false
      })
      .returning()
      .execute();

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'test-wedding',
        bride_name: 'Jane Doe',
        groom_name: 'John Smith',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test Street'
      })
      .returning()
      .execute();

    const result = await getProjectRsvps(projectResult[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all RSVPs for a specific project', async () => {
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

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "simple"}',
        is_premium: false
      })
      .returning()
      .execute();

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'test-wedding',
        bride_name: 'Jane Doe',
        groom_name: 'John Smith',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test Street'
      })
      .returning()
      .execute();

    // Create multiple RSVP entries
    const rsvpData = [
      {
        project_id: projectResult[0].id,
        guest_name: 'Alice Johnson',
        guest_email: 'alice@example.com',
        guest_phone: '+1234567890',
        status: 'yes' as const,
        guest_count: 2,
        message: 'Looking forward to it!',
        unique_link: 'unique-link-1',
        responded_at: new Date('2024-01-15T10:00:00Z')
      },
      {
        project_id: projectResult[0].id,
        guest_name: 'Bob Wilson',
        guest_email: 'bob@example.com',
        status: 'no' as const,
        guest_count: 1,
        message: 'Sorry, cannot attend',
        unique_link: 'unique-link-2',
        responded_at: new Date('2024-01-16T14:30:00Z')
      },
      {
        project_id: projectResult[0].id,
        guest_name: 'Charlie Brown',
        guest_phone: '+0987654321',
        status: 'maybe' as const,
        guest_count: 3,
        unique_link: 'unique-link-3'
      }
    ];

    await db.insert(rsvpTable)
      .values(rsvpData)
      .execute();

    const result = await getProjectRsvps(projectResult[0].id);

    expect(result).toHaveLength(3);
    
    // Check first RSVP
    const aliceRsvp = result.find(r => r.guest_name === 'Alice Johnson');
    expect(aliceRsvp).toBeDefined();
    expect(aliceRsvp!.guest_email).toBe('alice@example.com');
    expect(aliceRsvp!.guest_phone).toBe('+1234567890');
    expect(aliceRsvp!.status).toBe('yes');
    expect(aliceRsvp!.guest_count).toBe(2);
    expect(aliceRsvp!.message).toBe('Looking forward to it!');
    expect(aliceRsvp!.unique_link).toBe('unique-link-1');
    expect(aliceRsvp!.responded_at).toBeInstanceOf(Date);
    expect(aliceRsvp!.created_at).toBeInstanceOf(Date);

    // Check second RSVP
    const bobRsvp = result.find(r => r.guest_name === 'Bob Wilson');
    expect(bobRsvp).toBeDefined();
    expect(bobRsvp!.status).toBe('no');
    expect(bobRsvp!.guest_count).toBe(1);
    expect(bobRsvp!.message).toBe('Sorry, cannot attend');
    expect(bobRsvp!.responded_at).toBeInstanceOf(Date);

    // Check third RSVP (no response yet)
    const charlieRsvp = result.find(r => r.guest_name === 'Charlie Brown');
    expect(charlieRsvp).toBeDefined();
    expect(charlieRsvp!.guest_email).toBeNull();
    expect(charlieRsvp!.guest_phone).toBe('+0987654321');
    expect(charlieRsvp!.status).toBe('maybe');
    expect(charlieRsvp!.guest_count).toBe(3);
    expect(charlieRsvp!.message).toBeNull();
    expect(charlieRsvp!.responded_at).toBeNull();
  });

  it('should only return RSVPs for the specified project', async () => {
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

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "simple"}',
        is_premium: false
      })
      .returning()
      .execute();

    // Create two test projects
    const project1Result = await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'wedding-1',
        bride_name: 'Jane Doe',
        groom_name: 'John Smith',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Venue 1',
        venue_address: '123 Test Street'
      })
      .returning()
      .execute();

    const project2Result = await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'wedding-2',
        bride_name: 'Mary Johnson',
        groom_name: 'Mike Davis',
        event_date: new Date('2024-07-20'),
        event_time: '16:00',
        venue_name: 'Venue 2',
        venue_address: '456 Another Street'
      })
      .returning()
      .execute();

    // Create RSVPs for both projects
    await db.insert(rsvpTable)
      .values([
        {
          project_id: project1Result[0].id,
          guest_name: 'Project 1 Guest 1',
          status: 'yes' as const,
          guest_count: 1,
          unique_link: 'project1-guest1'
        },
        {
          project_id: project1Result[0].id,
          guest_name: 'Project 1 Guest 2',
          status: 'no' as const,
          guest_count: 2,
          unique_link: 'project1-guest2'
        },
        {
          project_id: project2Result[0].id,
          guest_name: 'Project 2 Guest 1',
          status: 'yes' as const,
          guest_count: 1,
          unique_link: 'project2-guest1'
        }
      ])
      .execute();

    // Get RSVPs for project 1
    const project1Rsvps = await getProjectRsvps(project1Result[0].id);
    expect(project1Rsvps).toHaveLength(2);
    expect(project1Rsvps.every(r => r.project_id === project1Result[0].id)).toBe(true);
    expect(project1Rsvps.some(r => r.guest_name === 'Project 1 Guest 1')).toBe(true);
    expect(project1Rsvps.some(r => r.guest_name === 'Project 1 Guest 2')).toBe(true);

    // Get RSVPs for project 2
    const project2Rsvps = await getProjectRsvps(project2Result[0].id);
    expect(project2Rsvps).toHaveLength(1);
    expect(project2Rsvps[0].project_id).toBe(project2Result[0].id);
    expect(project2Rsvps[0].guest_name).toBe('Project 2 Guest 1');
  });

  it('should return RSVPs with all status types', async () => {
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

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "simple"}',
        is_premium: false
      })
      .returning()
      .execute();

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'status-test',
        bride_name: 'Jane Doe',
        groom_name: 'John Smith',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test Street'
      })
      .returning()
      .execute();

    // Create RSVPs with different statuses
    await db.insert(rsvpTable)
      .values([
        {
          project_id: projectResult[0].id,
          guest_name: 'Yes Guest',
          status: 'yes' as const,
          guest_count: 2,
          unique_link: 'yes-guest'
        },
        {
          project_id: projectResult[0].id,
          guest_name: 'No Guest',
          status: 'no' as const,
          guest_count: 0,
          unique_link: 'no-guest'
        },
        {
          project_id: projectResult[0].id,
          guest_name: 'Maybe Guest',
          status: 'maybe' as const,
          guest_count: 1,
          unique_link: 'maybe-guest'
        }
      ])
      .execute();

    const result = await getProjectRsvps(projectResult[0].id);

    expect(result).toHaveLength(3);
    
    const statuses = result.map(r => r.status);
    expect(statuses).toContain('yes');
    expect(statuses).toContain('no');
    expect(statuses).toContain('maybe');

    // Verify guest count handling
    const yesGuest = result.find(r => r.status === 'yes');
    expect(yesGuest!.guest_count).toBe(2);
    
    const noGuest = result.find(r => r.status === 'no');
    expect(noGuest!.guest_count).toBe(0);
    
    const maybeGuest = result.find(r => r.status === 'maybe');
    expect(maybeGuest!.guest_count).toBe(1);
  });

  it('should handle project with non-existent ID', async () => {
    const result = await getProjectRsvps(999999);
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});