import { db } from '../db';
import { adsTable, adSetsTable } from '../db/schema';
import { type UpdateAdInput, type Ad } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAd = async (input: UpdateAdInput): Promise<Ad | null> => {
  try {
    // If ad_set_id is being updated, verify the new ad set exists
    if (input.ad_set_id !== undefined) {
      const adSetExists = await db.select({ id: adSetsTable.id })
        .from(adSetsTable)
        .where(eq(adSetsTable.id, input.ad_set_id))
        .execute();

      if (adSetExists.length === 0) {
        throw new Error(`Ad set with id ${input.ad_set_id} does not exist`);
      }
    }

    // Prepare update data with explicit typing
    const updateData: Partial<typeof adsTable.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.ad_set_id !== undefined) updateData.ad_set_id = input.ad_set_id;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.creative_type !== undefined) updateData.creative_type = input.creative_type;
    if (input.media_url !== undefined) updateData.media_url = input.media_url;
    if (input.headline !== undefined) updateData.headline = input.headline;
    if (input.body_text !== undefined) updateData.body_text = input.body_text;
    if (input.call_to_action !== undefined) updateData.call_to_action = input.call_to_action;
    if (input.destination_url !== undefined) updateData.destination_url = input.destination_url;

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Update the ad record
    const result = await db.update(adsTable)
      .set(updateData)
      .where(eq(adsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null; // Ad not found
    }

    // Convert numeric fields back to numbers before returning
    const ad = result[0];
    return {
      ...ad,
      spend: parseFloat(ad.spend) // Convert spend back to number
    };
  } catch (error) {
    console.error('Ad update failed:', error);
    throw error;
  }
};