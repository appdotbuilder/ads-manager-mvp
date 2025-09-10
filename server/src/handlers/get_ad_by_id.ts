import { db } from '../db';
import { adsTable } from '../db/schema';
import { type Ad, type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getAdById = async (input: IdInput): Promise<Ad | null> => {
  try {
    // Query the ad by ID
    const results = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const ad = results[0];

    // Convert numeric fields back to numbers
    return {
      ...ad,
      spend: parseFloat(ad.spend)
    };
  } catch (error) {
    console.error('Ad retrieval failed:', error);
    throw error;
  }
};