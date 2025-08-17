import { db } from '../db';
import { usersTable, projectsTable, paymentsTable, rsvpTable } from '../db/schema';
import { eq, count, sum, desc } from 'drizzle-orm';

interface AdminStats {
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    totalRsvps: number;
    activeProjects: number;
    publishedProjects: number;
    recentProjects: any[];
    recentPayments: any[];
}

export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        // Get total users count
        const totalUsersResult = await db.select({ count: count() })
            .from(usersTable)
            .execute();
        const totalUsers = totalUsersResult[0].count;

        // Get total projects count
        const totalProjectsResult = await db.select({ count: count() })
            .from(projectsTable)
            .execute();
        const totalProjects = totalProjectsResult[0].count;

        // Get total revenue from paid payments
        const totalRevenueResult = await db.select({ total: sum(paymentsTable.amount) })
            .from(paymentsTable)
            .where(eq(paymentsTable.status, 'paid'))
            .execute();
        const totalRevenue = totalRevenueResult[0].total ? parseFloat(totalRevenueResult[0].total) : 0;

        // Get total RSVPs count
        const totalRsvpsResult = await db.select({ count: count() })
            .from(rsvpTable)
            .execute();
        const totalRsvps = totalRsvpsResult[0].count;

        // Get active projects count (draft and published, not archived)
        const activeProjectsResult = await db.select({ count: count() })
            .from(projectsTable)
            .where(eq(projectsTable.status, 'draft'))
            .execute();
        const draftProjects = activeProjectsResult[0].count;

        const publishedProjectsResult = await db.select({ count: count() })
            .from(projectsTable)
            .where(eq(projectsTable.status, 'published'))
            .execute();
        const publishedProjects = publishedProjectsResult[0].count;

        const activeProjects = draftProjects + publishedProjects;

        // Get recent projects (last 10, ordered by created_at desc)
        const recentProjectsResult = await db.select()
            .from(projectsTable)
            .orderBy(desc(projectsTable.created_at))
            .limit(10)
            .execute();

        const recentProjects = recentProjectsResult.map(project => ({
            ...project,
            venue_latitude: project.venue_latitude ? parseFloat(project.venue_latitude) : null,
            venue_longitude: project.venue_longitude ? parseFloat(project.venue_longitude) : null,
        }));

        // Get recent payments (last 10, ordered by created_at desc)
        const recentPaymentsResult = await db.select()
            .from(paymentsTable)
            .orderBy(desc(paymentsTable.created_at))
            .limit(10)
            .execute();

        const recentPayments = recentPaymentsResult.map(payment => ({
            ...payment,
            amount: parseFloat(payment.amount),
        }));

        return {
            totalUsers,
            totalProjects,
            totalRevenue,
            totalRsvps,
            activeProjects,
            publishedProjects,
            recentProjects,
            recentPayments,
        };
    } catch (error) {
        console.error('Failed to get admin stats:', error);
        throw error;
    }
};