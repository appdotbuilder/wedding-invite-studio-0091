import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plansTable } from '../db/schema';
import { type CreatePlanInput } from '../schema';
import { getPlans } from '../handlers/get_plans';

// Test data for creating plans
const testPlan1: CreatePlanInput = {
  name: 'Basic Plan',
  description: 'Basic wedding website features',
  price: 29.99,
  currency: 'USD',
  features: JSON.stringify(['Custom domain', 'Photo gallery', 'RSVP system'])
};

const testPlan2: CreatePlanInput = {
  name: 'Premium Plan',
  description: 'Advanced wedding website features',
  price: 59.99,
  currency: 'USD',
  features: JSON.stringify(['Everything in Basic', 'Custom themes', 'Gift registry', 'Music playlist'])
};

const inactivePlan: CreatePlanInput = {
  name: 'Inactive Plan',
  description: 'This plan should not appear',
  price: 99.99,
  currency: 'USD',
  features: JSON.stringify(['Should not be visible'])
};

describe('getPlans', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active plans', async () => {
    // Create test plans
    await db.insert(plansTable)
      .values([
        {
          name: testPlan1.name,
          description: testPlan1.description,
          price: testPlan1.price.toString(),
          currency: testPlan1.currency,
          features: testPlan1.features,
          is_active: true
        },
        {
          name: testPlan2.name,
          description: testPlan2.description,
          price: testPlan2.price.toString(),
          currency: testPlan2.currency,
          features: testPlan2.features,
          is_active: true
        }
      ])
      .execute();

    const result = await getPlans();

    // Should return 2 active plans
    expect(result).toHaveLength(2);

    // Check first plan
    expect(result[0].name).toEqual('Basic Plan');
    expect(result[0].description).toEqual(testPlan1.description);
    expect(result[0].price).toEqual(29.99);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].currency).toEqual('USD');
    expect(result[0].features).toEqual(testPlan1.features);
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second plan
    expect(result[1].name).toEqual('Premium Plan');
    expect(result[1].price).toEqual(59.99);
    expect(typeof result[1].price).toBe('number');
    expect(result[1].is_active).toBe(true);
  });

  it('should exclude inactive plans', async () => {
    // Create both active and inactive plans
    await db.insert(plansTable)
      .values([
        {
          name: testPlan1.name,
          description: testPlan1.description,
          price: testPlan1.price.toString(),
          currency: testPlan1.currency,
          features: testPlan1.features,
          is_active: true
        },
        {
          name: inactivePlan.name,
          description: inactivePlan.description,
          price: inactivePlan.price.toString(),
          currency: inactivePlan.currency,
          features: inactivePlan.features,
          is_active: false
        }
      ])
      .execute();

    const result = await getPlans();

    // Should only return the active plan
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Plan');
    expect(result[0].is_active).toBe(true);

    // Verify the inactive plan is not included
    const inactivePlanFound = result.find(plan => plan.name === 'Inactive Plan');
    expect(inactivePlanFound).toBeUndefined();
  });

  it('should return empty array when no active plans exist', async () => {
    // Create only inactive plans
    await db.insert(plansTable)
      .values({
        name: inactivePlan.name,
        description: inactivePlan.description,
        price: inactivePlan.price.toString(),
        currency: inactivePlan.currency,
        features: inactivePlan.features,
        is_active: false
      })
      .execute();

    const result = await getPlans();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle plans with null descriptions', async () => {
    // Create plan with null description
    await db.insert(plansTable)
      .values({
        name: 'Plan with null description',
        description: null,
        price: '49.99',
        currency: 'USD',
        features: JSON.stringify(['Basic features']),
        is_active: true
      })
      .execute();

    const result = await getPlans();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].name).toEqual('Plan with null description');
    expect(result[0].price).toEqual(49.99);
  });

  it('should correctly convert price from string to number', async () => {
    // Create plan with specific price to test conversion
    await db.insert(plansTable)
      .values({
        name: 'Price Test Plan',
        description: 'Testing price conversion',
        price: '123.45',
        currency: 'USD',
        features: JSON.stringify(['Test feature']),
        is_active: true
      })
      .execute();

    const result = await getPlans();

    expect(result).toHaveLength(1);
    expect(result[0].price).toEqual(123.45);
    expect(typeof result[0].price).toBe('number');
  });

  it('should return plans sorted by database order', async () => {
    // Create multiple plans in specific order
    const plan1 = await db.insert(plansTable)
      .values({
        name: 'First Plan',
        description: 'Created first',
        price: '10.00',
        currency: 'USD',
        features: JSON.stringify(['Feature 1']),
        is_active: true
      })
      .returning()
      .execute();

    const plan2 = await db.insert(plansTable)
      .values({
        name: 'Second Plan',
        description: 'Created second',
        price: '20.00',
        currency: 'USD',
        features: JSON.stringify(['Feature 2']),
        is_active: true
      })
      .returning()
      .execute();

    const result = await getPlans();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(plan1[0].id);
    expect(result[1].id).toEqual(plan2[0].id);
    expect(result[0].name).toEqual('First Plan');
    expect(result[1].name).toEqual('Second Plan');
  });
});