import { db } from '../db';
import { plansTable } from '../db/schema';
import { type Plan } from '../schema';
import { eq } from 'drizzle-orm';

export const getPlans = async (): Promise<Plan[]> => {
  try {
    // Fetch all active plans from the database
    const results = await db.select()
      .from(plansTable)
      .where(eq(plansTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(plan => ({
      ...plan,
      price: parseFloat(plan.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    throw error;
  }
};