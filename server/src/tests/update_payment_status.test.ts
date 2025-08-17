import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable, paymentsTable, resellerEarningsTable } from '../db/schema';
import { type PaymentStatus } from '../schema';
import { updatePaymentStatus } from '../handlers/update_payment_status';
import { eq } from 'drizzle-orm';

describe('updatePaymentStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testReseller: any;
  let testTemplate: any;
  let testProject: any;
  let testPayment: any;

  const setupTestData = async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user'
      })
      .returning()
      .execute();
    testUser = users[0];

    // Create test reseller
    const resellers = await db.insert(usersTable)
      .values({
        email: 'reseller@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller',
        role: 'reseller'
      })
      .returning()
      .execute();
    testReseller = resellers[0];

    // Create test template
    const templates = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"theme": "elegant"}',
        is_premium: false
      })
      .returning()
      .execute();
    testTemplate = templates[0];

    // Create test project
    const projects = await db.insert(projectsTable)
      .values({
        user_id: testUser.id,
        template_id: testTemplate.id,
        subdomain: 'test-wedding',
        bride_name: 'Jane',
        groom_name: 'John',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: 'Test Address'
      })
      .returning()
      .execute();
    testProject = projects[0];

    // Create test payment
    const payments = await db.insert(paymentsTable)
      .values({
        project_id: testProject.id,
        user_id: testUser.id,
        amount: '150000',
        currency: 'IDR',
        payment_gateway: 'midtrans',
        gateway_payment_id: 'gateway_123',
        status: 'pending'
      })
      .returning()
      .execute();
    testPayment = payments[0];
  };

  const setupTestDataWithReseller = async () => {
    await setupTestData();

    // Update project to include reseller
    await db.update(projectsTable)
      .set({ reseller_id: testReseller.id })
      .where(eq(projectsTable.id, testProject.id))
      .execute();

    // Refresh project data
    const updatedProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProject.id))
      .execute();
    testProject = updatedProjects[0];
  };

  it('should update payment status to paid successfully', async () => {
    await setupTestData();

    const result = await updatePaymentStatus('gateway_123', 'paid', '{"status": "success"}');

    expect(result.status).toEqual('paid');
    expect(result.gateway_response).toEqual('{"status": "success"}');
    expect(result.paid_at).toBeInstanceOf(Date);
    expect(result.amount).toEqual(150000);
    expect(typeof result.amount).toBe('number');
  });

  it('should update project payment status when payment is paid', async () => {
    await setupTestData();

    await updatePaymentStatus('gateway_123', 'paid');

    // Check that project is_paid is updated
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProject.id))
      .execute();

    expect(projects[0].is_paid).toBe(true);
  });

  it('should create reseller earning when payment is paid and project has reseller', async () => {
    await setupTestDataWithReseller();

    await updatePaymentStatus('gateway_123', 'paid');

    // Check that reseller earning is created
    const earnings = await db.select()
      .from(resellerEarningsTable)
      .where(eq(resellerEarningsTable.payment_id, testPayment.id))
      .execute();

    expect(earnings).toHaveLength(1);
    expect(earnings[0].reseller_id).toEqual(testReseller.id);
    expect(earnings[0].project_id).toEqual(testProject.id);
    expect(parseFloat(earnings[0].commission_rate)).toEqual(0.1);
    expect(parseFloat(earnings[0].commission_amount)).toEqual(15000); // 10% of 150000
    expect(earnings[0].earned_at).toBeInstanceOf(Date);
  });

  it('should not create reseller earning when project has no reseller', async () => {
    await setupTestData();

    await updatePaymentStatus('gateway_123', 'paid');

    // Check that no reseller earning is created
    const earnings = await db.select()
      .from(resellerEarningsTable)
      .where(eq(resellerEarningsTable.payment_id, testPayment.id))
      .execute();

    expect(earnings).toHaveLength(0);
  });

  it('should update payment status to failed', async () => {
    await setupTestData();

    const result = await updatePaymentStatus('gateway_123', 'failed', '{"error": "insufficient_funds"}');

    expect(result.status).toEqual('failed');
    expect(result.gateway_response).toEqual('{"error": "insufficient_funds"}');
    expect(result.paid_at).toBeNull();
  });

  it('should not update project payment status when payment fails', async () => {
    await setupTestData();

    await updatePaymentStatus('gateway_123', 'failed');

    // Check that project is_paid remains false
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProject.id))
      .execute();

    expect(projects[0].is_paid).toBe(false);
  });

  it('should handle refunded status correctly', async () => {
    await setupTestData();

    // First set to paid
    await updatePaymentStatus('gateway_123', 'paid');

    // Then refund
    const result = await updatePaymentStatus('gateway_123', 'refunded', '{"refund_id": "ref_123"}');

    expect(result.status).toEqual('refunded');
    expect(result.gateway_response).toEqual('{"refund_id": "ref_123"}');
    expect(result.paid_at).toBeNull();
  });

  it('should throw error when gateway payment ID not found', async () => {
    await setupTestData();

    await expect(updatePaymentStatus('nonexistent_gateway_id', 'paid'))
      .rejects.toThrow(/Payment not found for gateway payment ID/i);
  });

  it('should update payment without gateway response', async () => {
    await setupTestData();

    const result = await updatePaymentStatus('gateway_123', 'paid');

    expect(result.status).toEqual('paid');
    expect(result.gateway_response).toBeNull();
    expect(result.paid_at).toBeInstanceOf(Date);
  });

  it('should handle multiple status updates correctly', async () => {
    await setupTestData();

    // First update to pending
    let result = await updatePaymentStatus('gateway_123', 'pending');
    expect(result.status).toEqual('pending');
    expect(result.paid_at).toBeNull();

    // Then update to paid
    result = await updatePaymentStatus('gateway_123', 'paid');
    expect(result.status).toEqual('paid');
    expect(result.paid_at).toBeInstanceOf(Date);

    // Check project status is updated
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, testProject.id))
      .execute();

    expect(projects[0].is_paid).toBe(true);
  });

  it('should not create duplicate reseller earnings for same payment', async () => {
    await setupTestDataWithReseller();

    // Update to paid twice
    await updatePaymentStatus('gateway_123', 'paid');
    await updatePaymentStatus('gateway_123', 'paid');

    // Should still only have one earning record
    const earnings = await db.select()
      .from(resellerEarningsTable)
      .where(eq(resellerEarningsTable.payment_id, testPayment.id))
      .execute();

    expect(earnings).toHaveLength(1);
  });
});