import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, paymentsTable, rsvpTable, templatesTable } from '../db/schema';
import { getAdminStats } from '../handlers/get_admin_stats';

describe('getAdminStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when database is empty', async () => {
    const result = await getAdminStats();

    expect(result.totalUsers).toBe(0);
    expect(result.totalProjects).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalRsvps).toBe(0);
    expect(result.activeProjects).toBe(0);
    expect(result.publishedProjects).toBe(0);
    expect(result.recentProjects).toEqual([]);
    expect(result.recentPayments).toEqual([]);
  });

  it('should return correct stats with sample data', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@test.com',
          password_hash: 'hash1',
          full_name: 'User One',
          role: 'user',
        },
        {
          email: 'user2@test.com',
          password_hash: 'hash2',
          full_name: 'User Two',
          role: 'reseller',
        },
        {
          email: 'admin@test.com',
          password_hash: 'hash3',
          full_name: 'Admin User',
          role: 'admin',
        },
      ])
      .returning()
      .execute();

    // Create template
    const templates = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: JSON.stringify({ layout: 'basic' }),
      })
      .returning()
      .execute();

    // Create projects with different statuses, inserting them sequentially to ensure proper ordering
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    const project1 = await db.insert(projectsTable)
      .values({
        user_id: users[0].id,
        template_id: templates[0].id,
        subdomain: 'wedding1',
        bride_name: 'Alice',
        groom_name: 'Bob',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Beach Resort',
        venue_address: '123 Beach Ave',
        status: 'published',
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const project2 = await db.insert(projectsTable)
      .values({
        user_id: users[1].id,
        template_id: templates[0].id,
        subdomain: 'wedding2',
        bride_name: 'Carol',
        groom_name: 'Dave',
        event_date: new Date('2024-07-20'),
        event_time: '16:00',
        venue_name: 'Garden Hall',
        venue_address: '456 Garden St',
        status: 'draft',
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const project3 = await db.insert(projectsTable)
      .values({
        user_id: users[0].id,
        template_id: templates[0].id,
        subdomain: 'wedding3',
        bride_name: 'Eve',
        groom_name: 'Frank',
        event_date: new Date('2024-08-10'),
        event_time: '19:00',
        venue_name: 'City Hall',
        venue_address: '789 City Ave',
        status: 'archived',
      })
      .returning()
      .execute();

    const projects = [...project1, ...project2, ...project3];

    // Create payments with different statuses (sequential to ensure proper ordering)
    await db.insert(paymentsTable)
      .values({
        project_id: projects[0].id,
        user_id: users[0].id,
        amount: '150.00',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'paid',
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(paymentsTable)
      .values({
        project_id: projects[1].id,
        user_id: users[1].id,
        amount: '200.00',
        currency: 'USD',
        payment_gateway: 'paypal',
        status: 'paid',
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(paymentsTable)
      .values({
        project_id: projects[2].id,
        user_id: users[0].id,
        amount: '100.00',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'pending',
      })
      .execute();

    // Create RSVPs
    await db.insert(rsvpTable)
      .values([
        {
          project_id: projects[0].id,
          guest_name: 'Guest One',
          status: 'yes',
          guest_count: 2,
          unique_link: 'link1',
        },
        {
          project_id: projects[0].id,
          guest_name: 'Guest Two',
          status: 'no',
          guest_count: 1,
          unique_link: 'link2',
        },
        {
          project_id: projects[1].id,
          guest_name: 'Guest Three',
          status: 'maybe',
          guest_count: 3,
          unique_link: 'link3',
        },
      ])
      .execute();

    const result = await getAdminStats();

    // Verify counts
    expect(result.totalUsers).toBe(3);
    expect(result.totalProjects).toBe(3);
    expect(result.totalRevenue).toBe(350); // 150 + 200 (only paid payments)
    expect(result.totalRsvps).toBe(3);
    expect(result.activeProjects).toBe(2); // draft + published
    expect(result.publishedProjects).toBe(1);

    // Verify recent projects are returned
    expect(result.recentProjects).toHaveLength(3);
    expect(result.recentProjects[0].bride_name).toBe('Eve'); // Most recent
    expect(result.recentProjects[1].bride_name).toBe('Carol');
    expect(result.recentProjects[2].bride_name).toBe('Alice');

    // Verify recent payments are returned with proper numeric conversion
    expect(result.recentPayments).toHaveLength(3);
    expect(typeof result.recentPayments[0].amount).toBe('number');
    expect(result.recentPayments.every(p => typeof p.amount === 'number')).toBe(true);
  });

  it('should limit recent data to 10 items', async () => {
    // Create user and template first
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const template = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: JSON.stringify({ layout: 'basic' }),
      })
      .returning()
      .execute();

    // Create 15 projects
    const projectsData = Array.from({ length: 15 }, (_, i) => ({
      user_id: user[0].id,
      template_id: template[0].id,
      subdomain: `wedding${i + 1}`,
      bride_name: `Bride ${i + 1}`,
      groom_name: `Groom ${i + 1}`,
      event_date: new Date('2024-06-15'),
      event_time: '18:00',
      venue_name: `Venue ${i + 1}`,
      venue_address: `${i + 1} Main St`,
      status: 'draft' as const,
    }));

    const projects = await db.insert(projectsTable)
      .values(projectsData)
      .returning()
      .execute();

    // Create 15 payments
    const paymentsData = projects.map((project, i) => ({
      project_id: project.id,
      user_id: user[0].id,
      amount: `${100 + i}.00`,
      currency: 'USD',
      payment_gateway: 'stripe',
      status: 'paid' as const,
    }));

    await db.insert(paymentsTable)
      .values(paymentsData)
      .execute();

    const result = await getAdminStats();

    // Should limit to 10 recent items
    expect(result.recentProjects).toHaveLength(10);
    expect(result.recentPayments).toHaveLength(10);
    expect(result.totalProjects).toBe(15);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create user and template
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const template = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: JSON.stringify({ layout: 'basic' }),
      })
      .returning()
      .execute();

    // Create project with latitude/longitude
    const project = await db.insert(projectsTable)
      .values({
        user_id: user[0].id,
        template_id: template[0].id,
        subdomain: 'wedding1',
        bride_name: 'Alice',
        groom_name: 'Bob',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Beach Resort',
        venue_address: '123 Beach Ave',
        venue_latitude: '40.7128',
        venue_longitude: '-74.0060',
        status: 'published',
      })
      .returning()
      .execute();

    // Create payment
    await db.insert(paymentsTable)
      .values({
        project_id: project[0].id,
        user_id: user[0].id,
        amount: '199.99',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'paid',
      })
      .execute();

    const result = await getAdminStats();

    // Check numeric conversions
    expect(typeof result.totalRevenue).toBe('number');
    expect(result.totalRevenue).toBe(199.99);
    
    expect(typeof result.recentProjects[0].venue_latitude).toBe('number');
    expect(typeof result.recentProjects[0].venue_longitude).toBe('number');
    expect(result.recentProjects[0].venue_latitude).toBe(40.7128);
    expect(result.recentProjects[0].venue_longitude).toBe(-74.0060);

    expect(typeof result.recentPayments[0].amount).toBe('number');
    expect(result.recentPayments[0].amount).toBe(199.99);
  });

  it('should handle null revenue when no paid payments exist', async () => {
    // Create user and template
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hash',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const template = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: JSON.stringify({ layout: 'basic' }),
      })
      .returning()
      .execute();

    const project = await db.insert(projectsTable)
      .values({
        user_id: user[0].id,
        template_id: template[0].id,
        subdomain: 'wedding1',
        bride_name: 'Alice',
        groom_name: 'Bob',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Beach Resort',
        venue_address: '123 Beach Ave',
        status: 'draft',
      })
      .returning()
      .execute();

    // Create only pending payments (not paid)
    await db.insert(paymentsTable)
      .values({
        project_id: project[0].id,
        user_id: user[0].id,
        amount: '100.00',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'pending',
      })
      .execute();

    const result = await getAdminStats();

    // Should return 0 revenue when no paid payments exist
    expect(result.totalRevenue).toBe(0);
    expect(typeof result.totalRevenue).toBe('number');
  });
});