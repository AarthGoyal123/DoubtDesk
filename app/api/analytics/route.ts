import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { doubtsTable } from '@/configs/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET() {
    try {
        // 1. Trending Doubts (Most recent unique contents)
        const trendingDoubts = await db.select({
            id: doubtsTable.id,
            content: doubtsTable.content,
            subject: doubtsTable.subject,
            createdAt: doubtsTable.createdAt
        })
        .from(doubtsTable)
        .orderBy(desc(doubtsTable.createdAt))
        .limit(5);

        // 2. Most Asked Topics (Group by subject and count)
        const mostAskedTopics = await db.select({
            subject: doubtsTable.subject,
            count: sql<number>`count(${doubtsTable.id})`.as('count')
        })
        .from(doubtsTable)
        .groupBy(doubtsTable.subject)
        .orderBy(desc(sql`count`))
        .limit(5);

        // 3. Weak Topics (Just the high volume ones for now, or could be others)
        // Let's just return the same but labeled differently or with more data
        const weakTopics = mostAskedTopics.map((topic, index) => ({
            ...topic,
            severity: index === 0 ? 'High' : index < 3 ? 'Medium' : 'Low'
        }));

        return NextResponse.json({
            trendingDoubts,
            mostAskedTopics,
            weakTopics
        });

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        );
    }
}
