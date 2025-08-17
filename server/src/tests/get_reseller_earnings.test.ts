import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable, paymentsTable, resellerEarningsTable } from '../db/schema';
import { getResellerEarnings } from '../handlers/get_reseller_earnings';
import { eq } from 'drizzle-orm';

describe('getResellerEarnings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch earnings for a specific reseller', async () => {
    // Create test users
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const resellerResult = await db.insert(usersTable)
      .values({
        email: 'reseller@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller',
        role: 'reseller',
      })
      .returning()
      .execute();

    const user = userResult[0];
    const reseller = resellerResult[0];

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "classic"}',
        is_premium: false,
      })
      .returning()
      .execute();

    const template = templateResult[0];

    // Create test project
    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: user.id,
        reseller_id: reseller.id,
        template_id: template.id,
        subdomain: 'test-wedding',
        bride_name: 'Jane Doe',
        groom_name: 'John Doe',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St',
        status: 'published',
        is_paid: true,
      })
      .returning()
      .execute();

    const project = projectResult[0];

    // Create test payment
    const paymentResult = await db.insert(paymentsTable)
      .values({
        project_id: project.id,
        user_id: user.id,
        amount: '100.00',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'paid',
        paid_at: new Date(),
      })
      .returning()
      .execute();

    const payment = paymentResult[0];

    // Create test earnings
    const earningsResult = await db.insert(resellerEarningsTable)
      .values({
        reseller_id: reseller.id,
        project_id: project.id,
        payment_id: payment.id,
        commission_rate: '0.1500',
        commission_amount: '15.00',
      })
      .returning()
      .execute();

    const earnings = await getResellerEarnings(reseller.id);

    expect(earnings).toHaveLength(1);
    const earning = earnings[0];

    expect(earning.reseller_id).toEqual(reseller.id);
    expect(earning.project_id).toEqual(project.id);
    expect(earning.payment_id).toEqual(payment.id);
    expect(earning.commission_rate).toEqual(0.15);
    expect(earning.commission_amount).toEqual(15.0);
    expect(typeof earning.commission_rate).toBe('number');
    expect(typeof earning.commission_amount).toBe('number');
    expect(earning.earned_at).toBeInstanceOf(Date);
    expect(earning.created_at).toBeInstanceOf(Date);
    expect(earning.id).toBeDefined();
  });

  it('should return multiple earnings ordered by earned_at desc', async () => {
    // Create test users
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const resellerResult = await db.insert(usersTable)
      .values({
        email: 'reseller@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller',
        role: 'reseller',
      })
      .returning()
      .execute();

    const user = userResult[0];
    const reseller = resellerResult[0];

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "classic"}',
        is_premium: false,
      })
      .returning()
      .execute();

    const template = templateResult[0];

    // Create multiple projects and payments
    const projects = [];
    const payments = [];

    for (let i = 1; i <= 3; i++) {
      const projectResult = await db.insert(projectsTable)
        .values({
          user_id: user.id,
          reseller_id: reseller.id,
          template_id: template.id,
          subdomain: `test-wedding-${i}`,
          bride_name: 'Jane Doe',
          groom_name: 'John Doe',
          event_date: new Date('2024-06-15'),
          event_time: '18:00',
          venue_name: 'Test Venue',
          venue_address: '123 Test St',
          status: 'published',
          is_paid: true,
        })
        .returning()
        .execute();

      const paymentResult = await db.insert(paymentsTable)
        .values({
          project_id: projectResult[0].id,
          user_id: user.id,
          amount: `${100 * i}.00`,
          currency: 'USD',
          payment_gateway: 'stripe',
          status: 'paid',
          paid_at: new Date(),
        })
        .returning()
        .execute();

      projects.push(projectResult[0]);
      payments.push(paymentResult[0]);
    }

    // Create earnings with different earned_at dates
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    await db.insert(resellerEarningsTable)
      .values([
        {
          reseller_id: reseller.id,
          project_id: projects[0].id,
          payment_id: payments[0].id,
          commission_rate: '0.1500',
          commission_amount: '15.00',
          earned_at: twoDaysAgo,
        },
        {
          reseller_id: reseller.id,
          project_id: projects[1].id,
          payment_id: payments[1].id,
          commission_rate: '0.2000',
          commission_amount: '40.00',
          earned_at: yesterday,
        },
        {
          reseller_id: reseller.id,
          project_id: projects[2].id,
          payment_id: payments[2].id,
          commission_rate: '0.1250',
          commission_amount: '37.50',
          earned_at: now,
        },
      ])
      .execute();

    const earnings = await getResellerEarnings(reseller.id);

    expect(earnings).toHaveLength(3);
    
    // Should be ordered by earned_at desc (most recent first)
    expect(earnings[0].commission_amount).toEqual(37.5);
    expect(earnings[1].commission_amount).toEqual(40.0);
    expect(earnings[2].commission_amount).toEqual(15.0);

    // Verify all earnings have correct numeric types
    earnings.forEach(earning => {
      expect(typeof earning.commission_rate).toBe('number');
      expect(typeof earning.commission_amount).toBe('number');
      expect(earning.reseller_id).toEqual(reseller.id);
    });
  });

  it('should return empty array for reseller with no earnings', async () => {
    // Create a reseller with no earnings
    const resellerResult = await db.insert(usersTable)
      .values({
        email: 'reseller@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller',
        role: 'reseller',
      })
      .returning()
      .execute();

    const reseller = resellerResult[0];

    const earnings = await getResellerEarnings(reseller.id);

    expect(earnings).toHaveLength(0);
  });

  it('should only return earnings for the specified reseller', async () => {
    // Create two resellers
    const reseller1Result = await db.insert(usersTable)
      .values({
        email: 'reseller1@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller 1',
        role: 'reseller',
      })
      .returning()
      .execute();

    const reseller2Result = await db.insert(usersTable)
      .values({
        email: 'reseller2@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller 2',
        role: 'reseller',
      })
      .returning()
      .execute();

    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const reseller1 = reseller1Result[0];
    const reseller2 = reseller2Result[0];
    const user = userResult[0];

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "classic"}',
        is_premium: false,
      })
      .returning()
      .execute();

    const template = templateResult[0];

    // Create projects for both resellers
    const project1Result = await db.insert(projectsTable)
      .values({
        user_id: user.id,
        reseller_id: reseller1.id,
        template_id: template.id,
        subdomain: 'test-wedding-1',
        bride_name: 'Jane Doe',
        groom_name: 'John Doe',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St',
        status: 'published',
        is_paid: true,
      })
      .returning()
      .execute();

    const project2Result = await db.insert(projectsTable)
      .values({
        user_id: user.id,
        reseller_id: reseller2.id,
        template_id: template.id,
        subdomain: 'test-wedding-2',
        bride_name: 'Jane Doe',
        groom_name: 'John Doe',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St',
        status: 'published',
        is_paid: true,
      })
      .returning()
      .execute();

    const project1 = project1Result[0];
    const project2 = project2Result[0];

    // Create payments for both projects
    const payment1Result = await db.insert(paymentsTable)
      .values({
        project_id: project1.id,
        user_id: user.id,
        amount: '100.00',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'paid',
        paid_at: new Date(),
      })
      .returning()
      .execute();

    const payment2Result = await db.insert(paymentsTable)
      .values({
        project_id: project2.id,
        user_id: user.id,
        amount: '200.00',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'paid',
        paid_at: new Date(),
      })
      .returning()
      .execute();

    const payment1 = payment1Result[0];
    const payment2 = payment2Result[0];

    // Create earnings for both resellers
    await db.insert(resellerEarningsTable)
      .values([
        {
          reseller_id: reseller1.id,
          project_id: project1.id,
          payment_id: payment1.id,
          commission_rate: '0.1500',
          commission_amount: '15.00',
        },
        {
          reseller_id: reseller2.id,
          project_id: project2.id,
          payment_id: payment2.id,
          commission_rate: '0.2000',
          commission_amount: '40.00',
        },
      ])
      .execute();

    // Fetch earnings for reseller1 only
    const reseller1Earnings = await getResellerEarnings(reseller1.id);

    expect(reseller1Earnings).toHaveLength(1);
    expect(reseller1Earnings[0].reseller_id).toEqual(reseller1.id);
    expect(reseller1Earnings[0].commission_amount).toEqual(15.0);

    // Fetch earnings for reseller2 only
    const reseller2Earnings = await getResellerEarnings(reseller2.id);

    expect(reseller2Earnings).toHaveLength(1);
    expect(reseller2Earnings[0].reseller_id).toEqual(reseller2.id);
    expect(reseller2Earnings[0].commission_amount).toEqual(40.0);
  });

  it('should handle database query correctly', async () => {
    // Create prerequisites
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();

    const resellerResult = await db.insert(usersTable)
      .values({
        email: 'reseller@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller',
        role: 'reseller',
      })
      .returning()
      .execute();

    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "classic"}',
        is_premium: false,
      })
      .returning()
      .execute();

    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        reseller_id: resellerResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'test-wedding',
        bride_name: 'Jane Doe',
        groom_name: 'John Doe',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St',
        status: 'published',
        is_paid: true,
      })
      .returning()
      .execute();

    const paymentResult = await db.insert(paymentsTable)
      .values({
        project_id: projectResult[0].id,
        user_id: userResult[0].id,
        amount: '250.75',
        currency: 'USD',
        payment_gateway: 'stripe',
        status: 'paid',
        paid_at: new Date(),
      })
      .returning()
      .execute();

    await db.insert(resellerEarningsTable)
      .values({
        reseller_id: resellerResult[0].id,
        project_id: projectResult[0].id,
        payment_id: paymentResult[0].id,
        commission_rate: '0.1750',
        commission_amount: '43.88',
      })
      .execute();

    const earnings = await getResellerEarnings(resellerResult[0].id);

    // Verify the data is fetched and processed correctly
    expect(earnings).toHaveLength(1);
    const earning = earnings[0];

    // Verify all required fields are present and correctly typed
    expect(earning.id).toBeDefined();
    expect(earning.reseller_id).toEqual(resellerResult[0].id);
    expect(earning.project_id).toEqual(projectResult[0].id);
    expect(earning.payment_id).toEqual(paymentResult[0].id);
    expect(earning.commission_rate).toEqual(0.175);
    expect(earning.commission_amount).toEqual(43.88);
    expect(earning.earned_at).toBeInstanceOf(Date);
    expect(earning.created_at).toBeInstanceOf(Date);

    // Verify data integrity in database
    const dbEarnings = await db.select()
      .from(resellerEarningsTable)
      .where(eq(resellerEarningsTable.reseller_id, resellerResult[0].id))
      .execute();

    expect(dbEarnings).toHaveLength(1);
    expect(parseFloat(dbEarnings[0].commission_rate)).toEqual(0.175);
    expect(parseFloat(dbEarnings[0].commission_amount)).toEqual(43.88);
  });
});