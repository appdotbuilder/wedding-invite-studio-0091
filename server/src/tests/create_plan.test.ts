import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plansTable } from '../db/schema';
import { type CreatePlanInput } from '../schema';
import { createPlan } from '../handlers/create_plan';
import { eq } from 'drizzle-orm';

// Test input with valid features JSON
const testInput: CreatePlanInput = {
  name: 'Premium Plan',
  description: 'A premium plan with advanced features',
  price: 99.99,
  currency: 'USD',
  features: JSON.stringify({
    templates: 50,
    storage: '10GB',
    support: '24/7',
    analytics: true,
    custom_domain: true
  })
};

describe('createPlan', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a plan successfully', async () => {
    const result = await createPlan(testInput);

    // Basic field validation
    expect(result.name).toEqual('Premium Plan');
    expect(result.description).toEqual('A premium plan with advanced features');
    expect(result.price).toEqual(99.99);
    expect(typeof result.price).toBe('number');
    expect(result.currency).toEqual('USD');
    expect(result.features).toEqual(testInput.features);
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save plan to database correctly', async () => {
    const result = await createPlan(testInput);

    // Query database to verify the plan was saved
    const plans = await db.select()
      .from(plansTable)
      .where(eq(plansTable.id, result.id))
      .execute();

    expect(plans).toHaveLength(1);
    const savedPlan = plans[0];
    expect(savedPlan.name).toEqual('Premium Plan');
    expect(savedPlan.description).toEqual('A premium plan with advanced features');
    expect(parseFloat(savedPlan.price)).toEqual(99.99); // Verify numeric conversion
    expect(savedPlan.currency).toEqual('USD');
    expect(savedPlan.features).toEqual(testInput.features);
    expect(savedPlan.is_active).toBe(true);
    expect(savedPlan.created_at).toBeInstanceOf(Date);
    expect(savedPlan.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description correctly', async () => {
    const inputWithNullDescription: CreatePlanInput = {
      ...testInput,
      description: null
    };

    const result = await createPlan(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Premium Plan');
    expect(result.price).toEqual(99.99);
  });

  it('should handle zero price correctly', async () => {
    const freePlanInput: CreatePlanInput = {
      name: 'Free Plan',
      description: 'Basic free plan',
      price: 0,
      currency: 'USD',
      features: JSON.stringify({
        templates: 5,
        storage: '1GB',
        support: 'email'
      })
    };

    const result = await createPlan(freePlanInput);

    expect(result.price).toEqual(0);
    expect(typeof result.price).toBe('number');
    expect(result.name).toEqual('Free Plan');
  });

  it('should validate features JSON structure', async () => {
    const invalidInput: CreatePlanInput = {
      ...testInput,
      features: 'invalid json string {'
    };

    await expect(createPlan(invalidInput)).rejects.toThrow(/invalid features json format/i);
  });

  it('should handle different currency codes', async () => {
    const euroPlanInput: CreatePlanInput = {
      name: 'European Plan',
      description: 'Plan for European customers',
      price: 89.50,
      currency: 'EUR',
      features: JSON.stringify({
        templates: 30,
        support: 'chat'
      })
    };

    const result = await createPlan(euroPlanInput);

    expect(result.currency).toEqual('EUR');
    expect(result.price).toEqual(89.50);
    expect(result.name).toEqual('European Plan');
  });

  it('should handle complex features JSON structure', async () => {
    const complexFeaturesInput: CreatePlanInput = {
      name: 'Enterprise Plan',
      description: 'Full-featured enterprise plan',
      price: 299.99,
      currency: 'USD',
      features: JSON.stringify({
        templates: {
          count: 'unlimited',
          premium: true,
          custom: true
        },
        storage: {
          amount: '100GB',
          backup: true
        },
        support: {
          level: 'priority',
          channels: ['phone', 'email', 'chat'],
          hours: '24/7'
        },
        analytics: {
          advanced: true,
          realtime: true,
          export: ['csv', 'pdf']
        },
        integrations: ['stripe', 'mailchimp', 'google_analytics']
      })
    };

    const result = await createPlan(complexFeaturesInput);

    expect(result.features).toEqual(complexFeaturesInput.features);
    const parsedFeatures = JSON.parse(result.features);
    expect(parsedFeatures.templates.count).toEqual('unlimited');
    expect(parsedFeatures.support.channels).toContain('phone');
    expect(parsedFeatures.integrations).toHaveLength(3);
  });
});