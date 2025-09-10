import { db } from '../db';
import { adSetsTable } from '../db/schema';
import { type UpdateAdSetInput, type AdSet } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAdSet = async (input: UpdateAdSetInput): Promise<AdSet | null> => {
  try {
    const { id, ...updateData } = input;

    // Build update object with only provided fields
    const updateFields: any = {};
    
    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }
    if (updateData.campaign_id !== undefined) {
      updateFields.campaign_id = updateData.campaign_id;
    }
    if (updateData.status !== undefined) {
      updateFields.status = updateData.status;
    }
    if (updateData.daily_budget !== undefined) {
      updateFields.daily_budget = updateData.daily_budget.toString(); // Convert to string for numeric column
    }
    if (updateData.start_date !== undefined) {
      updateFields.start_date = updateData.start_date;
    }
    if (updateData.end_date !== undefined) {
      updateFields.end_date = updateData.end_date;
    }
    if (updateData.targeting_description !== undefined) {
      updateFields.targeting_description = updateData.targeting_description;
    }

    // Always update the updated_at timestamp
    updateFields.updated_at = new Date();

    // If no fields to update, return null
    if (Object.keys(updateFields).length === 1) { // Only updated_at
      return null;
    }

    // Update the ad set
    const result = await db.update(adSetsTable)
      .set(updateFields)
      .where(eq(adSetsTable.id, id))
      .returning()
      .execute();

    // Return null if no ad set was found
    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const adSet = result[0];
    return {
      ...adSet,
      daily_budget: parseFloat(adSet.daily_budget),
      spend: parseFloat(adSet.spend)
    };
  } catch (error) {
    console.error('Ad set update failed:', error);
    throw error;
  }
};