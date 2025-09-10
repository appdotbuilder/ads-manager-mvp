import { db } from '../db';
import { adsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Ad, type IdInput } from '../schema';

export const getAdsByAdSet = async (input: IdInput): Promise<Ad[]> => {
  try {
    const results = await db.select()
      .from(adsTable)
      .where(eq(adsTable.ad_set_id, input.id))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(ad => ({
      ...ad,
      spend: parseFloat(ad.spend) // Convert spend to number
    }));
  } catch (error) {
    console.error('Failed to get ads by ad set:', error);
    throw error;
  }
};