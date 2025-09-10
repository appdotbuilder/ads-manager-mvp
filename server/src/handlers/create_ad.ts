import { db } from '../db';
import { adsTable } from '../db/schema';
import { type CreateAdInput, type Ad } from '../schema';

export const createAd = async (input: CreateAdInput): Promise<Ad> => {
  try {
    // Insert ad record
    const result = await db.insert(adsTable)
      .values({
        name: input.name,
        ad_set_id: input.ad_set_id,
        status: input.status,
        creative_type: input.creative_type,
        media_url: input.media_url,
        headline: input.headline,
        body_text: input.body_text,
        call_to_action: input.call_to_action,
        destination_url: input.destination_url,
        // Default values for metrics (using string for numeric columns)
        impressions: 0,
        clicks: 0,
        spend: '0.00' // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const ad = result[0];
    return {
      ...ad,
      spend: parseFloat(ad.spend) // Convert string back to number
    };
  } catch (error) {
    console.error('Ad creation failed:', error);
    throw error;
  }
};