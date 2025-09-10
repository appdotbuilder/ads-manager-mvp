import { db } from '../db';
import { adSetsTable } from '../db/schema';
import { type AdSet } from '../schema';

export const getAdSets = async (): Promise<AdSet[]> => {
  try {
    const results = await db.select()
      .from(adSetsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(adSet => ({
      ...adSet,
      daily_budget: parseFloat(adSet.daily_budget),
      spend: parseFloat(adSet.spend)
    }));
  } catch (error) {
    console.error('Failed to fetch ad sets:', error);
    throw error;
  }
};