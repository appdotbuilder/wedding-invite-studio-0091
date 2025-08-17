import { db } from '../db';
import { plansTable } from '../db/schema';
import { type CreatePlanInput, type Plan } from '../schema';

export const createPlan = async (input: CreatePlanInput): Promise<Plan> => {
  try {
    // Validate features JSON structure
    try {
      JSON.parse(input.features);
    } catch (error) {
      throw new Error('Invalid features JSON format');
    }

    // Insert plan record
    const result = await db.insert(plansTable)
      .values({
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        currency: input.currency,
        features: input.features,
        is_active: true // Default value from schema
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const plan = result[0];
    return {
      ...plan,
      price: parseFloat(plan.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Plan creation failed:', error);
    throw error;
  }
};