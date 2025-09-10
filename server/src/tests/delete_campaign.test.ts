import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type IdInput, type CreateCampaignInput } from '../schema';
import { deleteCampaign } from '../handlers/delete_campaign';
import { eq } from 'drizzle-orm';

// Test input for creating campaigns
const testCampaignInput: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.00,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

describe('deleteCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing campaign', async () => {
    // Create a campaign first
    const createResult = await db.insert(campaignsTable)
      .values({
        name: testCampaignInput.name,
        status: testCampaignInput.status,
        objective: testCampaignInput.objective,
        total_budget: testCampaignInput.total_budget.toString(),
        start_date: testCampaignInput.start_date,
        end_date: testCampaignInput.end_date
      })
      .returning()
      .execute();

    const campaignId = createResult[0].id;

    // Delete the campaign
    const deleteInput: IdInput = { id: campaignId };
    const result = await deleteCampaign(deleteInput);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify campaign no longer exists in database
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaignId))
      .execute();

    expect(campaigns).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent campaign', async () => {
    // Try to delete a campaign that doesn't exist
    const deleteInput: IdInput = { id: 999999 };
    const result = await deleteCampaign(deleteInput);

    // Verify deletion returned false
    expect(result).toBe(false);
  });

  it('should not affect other campaigns when deleting one', async () => {
    // Create multiple campaigns
    const campaign1 = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 1',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const campaign2 = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 2',
        status: 'Paused',
        objective: 'Lead Generation',
        total_budget: '2000.00',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28')
      })
      .returning()
      .execute();

    // Delete the first campaign
    const deleteInput: IdInput = { id: campaign1[0].id };
    const result = await deleteCampaign(deleteInput);

    expect(result).toBe(true);

    // Verify first campaign is deleted
    const deletedCampaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaign1[0].id))
      .execute();

    expect(deletedCampaigns).toHaveLength(0);

    // Verify second campaign still exists
    const remainingCampaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaign2[0].id))
      .execute();

    expect(remainingCampaigns).toHaveLength(1);
    expect(remainingCampaigns[0].name).toEqual('Campaign 2');
  });

  it('should handle malformed input gracefully', async () => {
    // Test with string instead of number to verify input validation
    const deleteInput = { id: 'invalid' } as any;
    
    await expect(deleteCampaign(deleteInput)).rejects.toThrow(/invalid/i);
  });
});