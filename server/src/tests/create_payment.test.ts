import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentsTable, usersTable, projectsTable, templatesTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProjectId: number;

  beforeEach(async () => {
    // Create prerequisite data for tests
    
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        full_name: 'Test User',
        role: 'user'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"theme": "classic"}',
        is_premium: false
      })
      .returning()
      .execute();
    const testTemplateId = templateResult[0].id;

    // Create a test project
    const projectResult = await db.insert(projectsTable)
      .values({
        user_id: testUserId,
        template_id: testTemplateId,
        subdomain: 'test-wedding',
        bride_name: 'Jane Doe',
        groom_name: 'John Doe',
        event_date: new Date('2024-12-25'),
        event_time: '18:00',
        venue_name: 'Grand Ballroom',
        venue_address: '123 Main St, City'
      })
      .returning()
      .execute();
    testProjectId = projectResult[0].id;
  });

  const testInput: CreatePaymentInput = {
    project_id: 0, // Will be set in tests
    user_id: 0, // Will be set in tests
    amount: 299.99,
    currency: 'IDR',
    payment_gateway: 'midtrans'
  };

  it('should create a payment record', async () => {
    const input = {
      ...testInput,
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await createPayment(input);

    // Basic field validation
    expect(result.project_id).toEqual(testProjectId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.amount).toEqual(299.99);
    expect(typeof result.amount).toBe('number'); // Verify numeric conversion
    expect(result.currency).toEqual('IDR');
    expect(result.payment_gateway).toEqual('midtrans');
    expect(result.status).toEqual('pending');
    expect(result.payment_method).toBeNull();
    expect(result.gateway_payment_id).toBeNull();
    expect(result.gateway_response).toBeNull();
    expect(result.paid_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    const input = {
      ...testInput,
      project_id: testProjectId,
      user_id: testUserId
    };

    const result = await createPayment(input);

    // Query using proper drizzle syntax
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].project_id).toEqual(testProjectId);
    expect(payments[0].user_id).toEqual(testUserId);
    expect(parseFloat(payments[0].amount)).toEqual(299.99); // Verify stored as string, converted properly
    expect(payments[0].currency).toEqual('IDR');
    expect(payments[0].payment_gateway).toEqual('midtrans');
    expect(payments[0].status).toEqual('pending');
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different payment gateways', async () => {
    const input = {
      ...testInput,
      project_id: testProjectId,
      user_id: testUserId,
      payment_gateway: 'xendit'
    };

    const result = await createPayment(input);

    expect(result.payment_gateway).toEqual('xendit');
    expect(result.status).toEqual('pending');
  });

  it('should handle different currencies', async () => {
    const input = {
      ...testInput,
      project_id: testProjectId,
      user_id: testUserId,
      amount: 49.99,
      currency: 'USD'
    };

    const result = await createPayment(input);

    expect(result.amount).toEqual(49.99);
    expect(result.currency).toEqual('USD');
  });

  it('should throw error for non-existent project', async () => {
    const input = {
      ...testInput,
      project_id: 99999,
      user_id: testUserId
    };

    await expect(createPayment(input)).rejects.toThrow(/Project with id 99999 not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...testInput,
      project_id: testProjectId,
      user_id: 99999
    };

    await expect(createPayment(input)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should handle decimal amounts correctly', async () => {
    const input = {
      ...testInput,
      project_id: testProjectId,
      user_id: testUserId,
      amount: 1234.56
    };

    const result = await createPayment(input);

    expect(result.amount).toEqual(1234.56);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(parseFloat(payments[0].amount)).toEqual(1234.56);
  });
});