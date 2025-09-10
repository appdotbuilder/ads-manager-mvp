import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdateCampaignInput, type Campaign } from '../schema';

export const updateCampaign = async (input: UpdateCampaignInput): Promise<Campaign | null> => {
  try {
    const { id, ...updateData } = input;
    
    // Check if campaign exists
    const existingCampaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, id))
      .execute();

    if (existingCampaign.length === 0) {
      return null;
    }

    // Prepare update values, converting numeric fields to strings
    const updateValues: any = {
      ...updateData,
      updated_at: new Date()
    };

    // Convert numeric fields to strings for database storage
    if (updateData.total_budget !== undefined) {
      updateValues.total_budget = updateData.total_budget.toString();
    }

    // Update the campaign
    const result = await db.update(campaignsTable)
      .set(updateValues)
      .where(eq(campaignsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const updatedCampaign = result[0];
    return {
      ...updatedCampaign,
      total_budget: parseFloat(updatedCampaign.total_budget),
      spend: parseFloat(updatedCampaign.spend)
    };
  } catch (error) {
    console.error('Campaign update failed:', error);
    throw error;
  }
};