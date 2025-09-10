import { db } from '../db';
import { adSetsTable } from '../db/schema';
import { type AdSet, type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getAdSetById = async (input: IdInput): Promise<AdSet | null> => {
  try {
    const result = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const adSet = result[0];
    return {
      ...adSet,
      daily_budget: parseFloat(adSet.daily_budget),
      spend: parseFloat(adSet.spend)
    };
  } catch (error) {
    console.error('Failed to fetch ad set by ID:', error);
    throw error;
  }
};