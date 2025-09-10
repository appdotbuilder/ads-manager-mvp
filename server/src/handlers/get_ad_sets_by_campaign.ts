import { db } from '../db';
import { adSetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type AdSet, type IdInput } from '../schema';

export const getAdSetsByCampaign = async (input: IdInput): Promise<AdSet[]> => {
  try {
    const results = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.campaign_id, input.id))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(adSet => ({
      ...adSet,
      daily_budget: parseFloat(adSet.daily_budget),
      spend: parseFloat(adSet.spend)
    }));
  } catch (error) {
    console.error('Failed to fetch ad sets for campaign:', error);
    throw error;
  }
};