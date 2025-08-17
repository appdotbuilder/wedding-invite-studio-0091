import { db } from '../db';
import { paymentsTable, projectsTable, resellerEarningsTable, usersTable } from '../db/schema';
import { type Payment, type PaymentStatus } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updatePaymentStatus = async (gatewayPaymentId: string, status: PaymentStatus, gatewayResponse?: string): Promise<Payment> => {
  try {
    // Find the payment by gateway payment ID
    const existingPayments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.gateway_payment_id, gatewayPaymentId))
      .execute();

    if (existingPayments.length === 0) {
      throw new Error(`Payment not found for gateway payment ID: ${gatewayPaymentId}`);
    }

    const existingPayment = existingPayments[0];

    // Update the payment status
    const updatedPayments = await db.update(paymentsTable)
      .set({
        status: status,
        gateway_response: gatewayResponse || null,
        paid_at: status === 'paid' ? new Date() : null,
        updated_at: new Date()
      })
      .where(eq(paymentsTable.gateway_payment_id, gatewayPaymentId))
      .returning()
      .execute();

    const updatedPayment = updatedPayments[0];

    // If payment is successful, update project payment status
    if (status === 'paid') {
      await db.update(projectsTable)
        .set({
          is_paid: true,
          updated_at: new Date()
        })
        .where(eq(projectsTable.id, updatedPayment.project_id))
        .execute();

      // Check if this project has a reseller and calculate commission
      const projects = await db.select()
        .from(projectsTable)
        .where(eq(projectsTable.id, updatedPayment.project_id))
        .execute();

      const project = projects[0];
      if (project && project.reseller_id) {
        // Check if earnings already exist for this payment to avoid duplicates
        const existingEarnings = await db.select()
          .from(resellerEarningsTable)
          .where(eq(resellerEarningsTable.payment_id, updatedPayment.id))
          .execute();

        if (existingEarnings.length === 0) {
          // Get reseller information to determine commission rate
          const resellers = await db.select()
            .from(usersTable)
            .where(and(
              eq(usersTable.id, project.reseller_id),
              eq(usersTable.role, 'reseller')
            ))
            .execute();

          if (resellers.length > 0) {
            // Default commission rate of 10% (0.1000)
            const commissionRate = 0.1000;
            const paymentAmount = parseFloat(updatedPayment.amount);
            const commissionAmount = paymentAmount * commissionRate;

            // Create reseller earning record
            await db.insert(resellerEarningsTable)
              .values({
                reseller_id: project.reseller_id,
                project_id: updatedPayment.project_id,
                payment_id: updatedPayment.id,
                commission_rate: commissionRate.toString(),
                commission_amount: commissionAmount.toString(),
                earned_at: new Date()
              })
              .execute();
          }
        }
      }
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...updatedPayment,
      amount: parseFloat(updatedPayment.amount)
    };
  } catch (error) {
    console.error('Payment status update failed:', error);
    throw error;
  }
};