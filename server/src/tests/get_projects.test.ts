import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let adminUser: any;
  let resellerUser: any;
  let regularUser: any;
  let template: any;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable).values([
      {
        email: 'admin@test.com',
        password_hash: 'hash1',
        full_name: 'Admin User',
        role: 'admin',
      },
      {
        email: 'reseller@test.com',
        password_hash: 'hash2',
        full_name: 'Reseller User',
        role: 'reseller',
      },
      {
        email: 'user@test.com',
        password_hash: 'hash3',
        full_name: 'Regular User',
        role: 'user',
      }
    ]).returning().execute();

    [adminUser, resellerUser, regularUser] = users;

    // Create test template
    const templates = await db.insert(templatesTable).values({
      name: 'Test Template',
      description: 'Test description',
      thumbnail_url: 'http://example.com/thumb.jpg',
      template_data: JSON.stringify({ layout: 'modern' }),
      is_premium: false,
    }).returning().execute();

    template = templates[0];
  });

  it('should return all projects for admin users', async () => {
    // Create projects for different users
    await db.insert(projectsTable).values([
      {
        user_id: regularUser.id,
        template_id: template.id,
        subdomain: 'project1',
        bride_name: 'Alice',
        groom_name: 'Bob',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Garden Hall',
        venue_address: '123 Garden St',
        venue_latitude: '40.7128',
        venue_longitude: '-74.0060',
      },
      {
        user_id: regularUser.id,
        reseller_id: resellerUser.id,
        template_id: template.id,
        subdomain: 'project2',
        bride_name: 'Carol',
        groom_name: 'Dave',
        event_date: new Date('2024-07-20'),
        event_time: '18:00',
        venue_name: 'Beach Resort',
        venue_address: '456 Beach Ave',
        venue_latitude: '25.7617',
        venue_longitude: '-80.1918',
      }
    ]).execute();

    const result = await getProjects(adminUser.id, 'admin');

    expect(result).toHaveLength(2);
    expect(result[0].bride_name).toEqual('Alice');
    expect(result[1].bride_name).toEqual('Carol');
    expect(typeof result[0].venue_latitude).toBe('number');
    expect(typeof result[0].venue_longitude).toBe('number');
    expect(result[0].venue_latitude).toEqual(40.7128);
    expect(result[0].venue_longitude).toEqual(-74.0060);
  });

  it('should return only user-owned projects for regular users', async () => {
    // Create projects for different users
    await db.insert(projectsTable).values([
      {
        user_id: regularUser.id,
        template_id: template.id,
        subdomain: 'project1',
        bride_name: 'Alice',
        groom_name: 'Bob',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Garden Hall',
        venue_address: '123 Garden St',
      },
      {
        user_id: adminUser.id, // Different user
        template_id: template.id,
        subdomain: 'project2',
        bride_name: 'Carol',
        groom_name: 'Dave',
        event_date: new Date('2024-07-20'),
        event_time: '18:00',
        venue_name: 'Beach Resort',
        venue_address: '456 Beach Ave',
      }
    ]).execute();

    const result = await getProjects(regularUser.id, 'user');

    expect(result).toHaveLength(1);
    expect(result[0].bride_name).toEqual('Alice');
    expect(result[0].user_id).toEqual(regularUser.id);
  });

  it('should return only reseller projects for reseller users', async () => {
    // Create projects with different reseller assignments
    await db.insert(projectsTable).values([
      {
        user_id: regularUser.id,
        reseller_id: resellerUser.id,
        template_id: template.id,
        subdomain: 'project1',
        bride_name: 'Alice',
        groom_name: 'Bob',
        event_date: new Date('2024-06-15'),
        event_time: '15:00',
        venue_name: 'Garden Hall',
        venue_address: '123 Garden St',
      },
      {
        user_id: regularUser.id,
        template_id: template.id,
        subdomain: 'project2',
        bride_name: 'Carol',
        groom_name: 'Dave',
        event_date: new Date('2024-07-20'),
        event_time: '18:00',
        venue_name: 'Beach Resort',
        venue_address: '456 Beach Ave',
      }
    ]).execute();

    const result = await getProjects(resellerUser.id, 'reseller');

    expect(result).toHaveLength(1);
    expect(result[0].bride_name).toEqual('Alice');
    expect(result[0].reseller_id).toEqual(resellerUser.id);
  });

  it('should return empty array when no projects match user role', async () => {
    // Create a project for a different user
    await db.insert(projectsTable).values({
      user_id: adminUser.id,
      template_id: template.id,
      subdomain: 'project1',
      bride_name: 'Alice',
      groom_name: 'Bob',
      event_date: new Date('2024-06-15'),
      event_time: '15:00',
      venue_name: 'Garden Hall',
      venue_address: '123 Garden St',
    }).execute();

    const result = await getProjects(regularUser.id, 'user');

    expect(result).toHaveLength(0);
  });

  it('should handle null venue coordinates correctly', async () => {
    await db.insert(projectsTable).values({
      user_id: regularUser.id,
      template_id: template.id,
      subdomain: 'project1',
      bride_name: 'Alice',
      groom_name: 'Bob',
      event_date: new Date('2024-06-15'),
      event_time: '15:00',
      venue_name: 'Garden Hall',
      venue_address: '123 Garden St',
      venue_latitude: null,
      venue_longitude: null,
    }).execute();

    const result = await getProjects(regularUser.id, 'user');

    expect(result).toHaveLength(1);
    expect(result[0].venue_latitude).toBeNull();
    expect(result[0].venue_longitude).toBeNull();
  });

  it('should return projects with correct data types', async () => {
    await db.insert(projectsTable).values({
      user_id: regularUser.id,
      template_id: template.id,
      subdomain: 'project1',
      bride_name: 'Alice',
      groom_name: 'Bob',
      event_date: new Date('2024-06-15'),
      event_time: '15:00',
      venue_name: 'Garden Hall',
      venue_address: '123 Garden St',
      venue_latitude: '40.7128',
      venue_longitude: '-74.0060',
      additional_info: 'Special instructions',
      custom_data: JSON.stringify({ color: 'blue' }),
      status: 'published',
      is_paid: true,
    }).execute();

    const result = await getProjects(regularUser.id, 'user');

    expect(result).toHaveLength(1);
    const project = result[0];

    // Verify all field types
    expect(typeof project.id).toBe('number');
    expect(typeof project.user_id).toBe('number');
    expect(typeof project.template_id).toBe('number');
    expect(typeof project.subdomain).toBe('string');
    expect(typeof project.bride_name).toBe('string');
    expect(typeof project.groom_name).toBe('string');
    expect(project.event_date).toBeInstanceOf(Date);
    expect(typeof project.event_time).toBe('string');
    expect(typeof project.venue_name).toBe('string');
    expect(typeof project.venue_address).toBe('string');
    expect(typeof project.venue_latitude).toBe('number');
    expect(typeof project.venue_longitude).toBe('number');
    expect(typeof project.additional_info).toBe('string');
    expect(typeof project.custom_data).toBe('string');
    expect(typeof project.status).toBe('string');
    expect(typeof project.is_paid).toBe('boolean');
    expect(project.created_at).toBeInstanceOf(Date);
    expect(project.updated_at).toBeInstanceOf(Date);
  });
});