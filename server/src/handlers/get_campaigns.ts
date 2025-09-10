import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type Campaign } from '../schema';

export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    const results = await db.select()
      .from(campaignsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(campaign => ({
      ...campaign,
      total_budget: parseFloat(campaign.total_budget),
      spend: parseFloat(campaign.spend)
    }));
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    throw error;
  }
};