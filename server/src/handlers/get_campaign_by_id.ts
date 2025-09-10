import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type Campaign, type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getCampaignById = async (input: IdInput): Promise<Campaign | null> => {
  try {
    const result = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const campaign = result[0];
    
    // Convert numeric fields back to numbers
    return {
      ...campaign,
      total_budget: parseFloat(campaign.total_budget),
      spend: parseFloat(campaign.spend)
    };
  } catch (error) {
    console.error('Failed to fetch campaign by ID:', error);
    throw error;
  }
};