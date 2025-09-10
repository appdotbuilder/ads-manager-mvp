import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateCampaignInput, type UpdateCampaignInput } from '../schema';
import { updateCampaign } from '../handlers/update_campaign';

// Test campaign data
const testCampaign: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.00,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('updateCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a campaign successfully', async () => {
    // Create a campaign first
    const [createdCampaign] = await db.insert(campaignsTable)
      .values({
        ...testCampaign,
        total_budget: testCampaign.total_budget.toString()
      })
      .returning()
      .execute();

    const updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      name: 'Updated Campaign Name',
      status: 'Paused',
      objective: 'Lead Generation',
      total_budget: 1500.00
    };

    const result = await updateCampaign(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCampaign.id);
    expect(result!.name).toEqual('Updated Campaign Name');
    expect(result!.status).toEqual('Paused');
    expect(result!.objective).toEqual('Lead Generation');
    expect(result!.total_budget).toEqual(1500.00);
    expect(typeof result!.total_budget).toEqual('number');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > createdCampaign.updated_at).toBe(true);
  });

  it('should update partial fields only', async () => {
    // Create a campaign first
    const [createdCampaign] = await db.insert(campaignsTable)
      .values({
        ...testCampaign,
        total_budget: testCampaign.total_budget.toString()
      })
      .returning()
      .execute();

    const updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      name: 'Partially Updated Name'
    };

    const result = await updateCampaign(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Partially Updated Name');
    expect(result!.status).toEqual(createdCampaign.status); // Unchanged
    expect(result!.objective).toEqual(createdCampaign.objective); // Unchanged
    expect(result!.total_budget).toEqual(parseFloat(createdCampaign.total_budget)); // Unchanged
    expect(result!.start_date).toEqual(createdCampaign.start_date); // Unchanged
    expect(result!.end_date).toEqual(createdCampaign.end_date); // Unchanged
  });

  it('should update dates correctly', async () => {
    // Create a campaign first
    const [createdCampaign] = await db.insert(campaignsTable)
      .values({
        ...testCampaign,
        total_budget: testCampaign.total_budget.toString()
      })
      .returning()
      .execute();

    const newStartDate = new Date('2024-06-01');
    const newEndDate = new Date('2024-12-31');

    const updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateCampaign(updateInput);

    expect(result).not.toBeNull();
    expect(result!.start_date).toEqual(newStartDate);
    expect(result!.end_date).toEqual(newEndDate);
  });

  it('should save updated campaign to database', async () => {
    // Create a campaign first
    const [createdCampaign] = await db.insert(campaignsTable)
      .values({
        ...testCampaign,
        total_budget: testCampaign.total_budget.toString()
      })
      .returning()
      .execute();

    const updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      name: 'Database Updated Name',
      total_budget: 2000.00
    };

    await updateCampaign(updateInput);

    // Verify the campaign was updated in the database
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, createdCampaign.id))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].name).toEqual('Database Updated Name');
    expect(parseFloat(campaigns[0].total_budget)).toEqual(2000.00);
    expect(campaigns[0].updated_at > createdCampaign.updated_at).toBe(true);
  });

  it('should return null for non-existent campaign', async () => {
    const updateInput: UpdateCampaignInput = {
      id: 999, // Non-existent ID
      name: 'Updated Name'
    };

    const result = await updateCampaign(updateInput);

    expect(result).toBeNull();
  });

  it('should handle numeric precision correctly', async () => {
    // Create a campaign first
    const [createdCampaign] = await db.insert(campaignsTable)
      .values({
        ...testCampaign,
        total_budget: testCampaign.total_budget.toString()
      })
      .returning()
      .execute();

    const updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      total_budget: 1234.56
    };

    const result = await updateCampaign(updateInput);

    expect(result).not.toBeNull();
    expect(result!.total_budget).toEqual(1234.56);
    expect(typeof result!.total_budget).toEqual('number');
  });

  it('should update all status enum values correctly', async () => {
    // Create a campaign first
    const [createdCampaign] = await db.insert(campaignsTable)
      .values({
        ...testCampaign,
        total_budget: testCampaign.total_budget.toString()
      })
      .returning()
      .execute();

    // Test updating to 'Paused'
    let updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      status: 'Paused'
    };

    let result = await updateCampaign(updateInput);
    expect(result!.status).toEqual('Paused');

    // Test updating to 'Deleted'
    updateInput = {
      id: createdCampaign.id,
      status: 'Deleted'
    };

    result = await updateCampaign(updateInput);
    expect(result!.status).toEqual('Deleted');

    // Test updating back to 'Active'
    updateInput = {
      id: createdCampaign.id,
      status: 'Active'
    };

    result = await updateCampaign(updateInput);
    expect(result!.status).toEqual('Active');
  });

  it('should preserve unchanged numeric fields', async () => {
    // Create a campaign with specific spend and other metrics
    const campaignData = {
      ...testCampaign,
      total_budget: testCampaign.total_budget.toString(),
      spend: '250.75',
      impressions: 1000,
      clicks: 50
    };

    const [createdCampaign] = await db.insert(campaignsTable)
      .values(campaignData)
      .returning()
      .execute();

    const updateInput: UpdateCampaignInput = {
      id: createdCampaign.id,
      name: 'Updated Name Only'
    };

    const result = await updateCampaign(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated Name Only');
    expect(result!.spend).toEqual(250.75); // Should be preserved as number
    expect(result!.impressions).toEqual(1000); // Should be preserved
    expect(result!.clicks).toEqual(50); // Should be preserved
    expect(typeof result!.spend).toEqual('number');
  });
});