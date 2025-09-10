import { db } from '../db';
import { adsTable } from '../db/schema';
import { type Ad } from '../schema';

export const getAds = async (): Promise<Ad[]> => {
  try {
    // Fetch all ads from the database
    const results = await db.select()
      .from(adsTable)
      .execute();

    // Convert numeric fields from strings to numbers
    return results.map(ad => ({
      ...ad,
      spend: parseFloat(ad.spend)
    }));
  } catch (error) {
    console.error('Failed to fetch ads:', error);
    throw error;
  }
};