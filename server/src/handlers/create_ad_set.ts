import { db } from '../db';
import { adSetsTable, campaignsTable } from '../db/schema';
import { type CreateAdSetInput, type AdSet } from '../schema';
import { eq } from 'drizzle-orm';

export const createAdSet = async (input: CreateAdSetInput): Promise<AdSet> => {
  try {
    // Verify that the campaign exists first to prevent foreign key constraint violations
    const campaign = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, input.campaign_id))
      .execute();

    if (campaign.length === 0) {
      throw new Error(`Campaign with id ${input.campaign_id} not found`);
    }

    // Insert ad set record
    const result = await db.insert(adSetsTable)
      .values({
        name: input.name,
        campaign_id: input.campaign_id,
        status: input.status,
        daily_budget: input.daily_budget.toString(), // Convert number to string for numeric column
        start_date: input.start_date,
        end_date: input.end_date,
        targeting_description: input.targeting_description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const adSet = result[0];
    return {
      ...adSet,
      daily_budget: parseFloat(adSet.daily_budget), // Convert string back to number
      spend: parseFloat(adSet.spend) // Convert string back to number
    };
  } catch (error) {
    console.error('Ad set creation failed:', error);
    throw error;
  }
};