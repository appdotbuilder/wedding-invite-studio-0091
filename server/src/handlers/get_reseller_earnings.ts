import { db } from '../db';
import { resellerEarningsTable, projectsTable, paymentsTable } from '../db/schema';
import { type ResellerEarning } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getResellerEarnings = async (resellerId: number): Promise<ResellerEarning[]> => {
  try {
    // Query reseller earnings with joined project and payment data for context
    const result = await db.select()
      .from(resellerEarningsTable)
      .innerJoin(projectsTable, eq(resellerEarningsTable.project_id, projectsTable.id))
      .innerJoin(paymentsTable, eq(resellerEarningsTable.payment_id, paymentsTable.id))
      .where(eq(resellerEarningsTable.reseller_id, resellerId))
      .orderBy(desc(resellerEarningsTable.earned_at))
      .execute();

    // Convert numeric fields and structure the response
    return result.map(row => ({
      id: row.reseller_earnings.id,
      reseller_id: row.reseller_earnings.reseller_id,
      project_id: row.reseller_earnings.project_id,
      payment_id: row.reseller_earnings.payment_id,
      commission_rate: parseFloat(row.reseller_earnings.commission_rate),
      commission_amount: parseFloat(row.reseller_earnings.commission_amount),
      earned_at: row.reseller_earnings.earned_at,
      created_at: row.reseller_earnings.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch reseller earnings:', error);
    throw error;
  }
};