import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type CreateCampaignInput, type Campaign } from '../schema';

export const createCampaign = async (input: CreateCampaignInput): Promise<Campaign> => {
  try {
    // Insert campaign record
    const result = await db.insert(campaignsTable)
      .values({
        name: input.name,
        status: input.status,
        objective: input.objective,
        total_budget: input.total_budget.toString(), // Convert number to string for numeric column
        start_date: input.start_date,
        end_date: input.end_date
        // impressions, clicks, spend have defaults in schema
        // created_at, updated_at have defaults in schema
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const campaign = result[0];
    return {
      ...campaign,
      total_budget: parseFloat(campaign.total_budget), // Convert string back to number
      spend: parseFloat(campaign.spend) // Convert string back to number
    };
  } catch (error) {
    console.error('Campaign creation failed:', error);
    throw error;
  }
};