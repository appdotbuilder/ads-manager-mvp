import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable } from '../db/schema';
import { type UpdateAdSetInput, type CreateCampaignInput, type CreateAdSetInput } from '../schema';
import { updateAdSet } from '../handlers/update_ad_set';
import { eq } from 'drizzle-orm';

// Test campaign input
const testCampaignInput: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.00,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

// Test ad set input
const testAdSetInput: CreateAdSetInput = {
  name: 'Test Ad Set',
  campaign_id: 1, // Will be set after campaign creation
  status: 'Active',
  daily_budget: 50.00,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31'),
  targeting_description: 'Age 25-54, Interests: Technology'
};

describe('updateAdSet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let campaignId: number;
  let adSetId: number;

  beforeEach(async () => {
    // Create a test campaign first
    const campaignResult = await db.insert(campaignsTable)
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

    campaignId = campaignResult[0].id;

    // Create a test ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        ...testAdSetInput,
        campaign_id: campaignId,
        daily_budget: testAdSetInput.daily_budget.toString()
      })
      .returning()
      .execute();

    adSetId = adSetResult[0].id;
  });

  it('should update ad set name', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      name: 'Updated Ad Set Name'
    };

    const result = await updateAdSet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(adSetId);
    expect(result!.name).toEqual('Updated Ad Set Name');
    expect(result!.campaign_id).toEqual(campaignId);
    expect(result!.status).toEqual('Active');
    expect(result!.daily_budget).toEqual(50.00);
    expect(typeof result!.daily_budget).toEqual('number');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update ad set status', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      status: 'Paused'
    };

    const result = await updateAdSet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('Paused');
    expect(result!.name).toEqual('Test Ad Set'); // Other fields unchanged
  });

  it('should update daily budget with proper numeric conversion', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      daily_budget: 75.50
    };

    const result = await updateAdSet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.daily_budget).toEqual(75.50);
    expect(typeof result!.daily_budget).toEqual('number');
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      name: 'Multi-Update Ad Set',
      status: 'Deleted',
      daily_budget: 100.00,
      targeting_description: 'Updated targeting: Age 18-65'
    };

    const result = await updateAdSet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Multi-Update Ad Set');
    expect(result!.status).toEqual('Deleted');
    expect(result!.daily_budget).toEqual(100.00);
    expect(result!.targeting_description).toEqual('Updated targeting: Age 18-65');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update campaign_id when valid', async () => {
    // Create another campaign
    const anotherCampaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Another Campaign',
        status: 'Active',
        objective: 'Conversions',
        total_budget: '2000.00',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28')
      })
      .returning()
      .execute();

    const anotherCampaignId = anotherCampaignResult[0].id;

    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      campaign_id: anotherCampaignId
    };

    const result = await updateAdSet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.campaign_id).toEqual(anotherCampaignId);
  });

  it('should update date fields correctly', async () => {
    const newStartDate = new Date('2024-03-01');
    const newEndDate = new Date('2024-03-31');

    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateAdSet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.start_date).toEqual(newStartDate);
    expect(result!.end_date).toEqual(newEndDate);
  });

  it('should save updated ad set to database', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      name: 'Database Test Ad Set',
      daily_budget: 80.25
    };

    const result = await updateAdSet(updateInput);

    // Verify in database
    const adSets = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, adSetId))
      .execute();

    expect(adSets).toHaveLength(1);
    expect(adSets[0].name).toEqual('Database Test Ad Set');
    expect(parseFloat(adSets[0].daily_budget)).toEqual(80.25);
    expect(adSets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ad set does not exist', async () => {
    const updateInput: UpdateAdSetInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Ad Set'
    };

    const result = await updateAdSet(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields are provided to update', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId
      // No other fields provided
    };

    const result = await updateAdSet(updateInput);

    expect(result).toBeNull();
  });

  it('should handle foreign key constraint violation for invalid campaign_id', async () => {
    const updateInput: UpdateAdSetInput = {
      id: adSetId,
      campaign_id: 99999 // Non-existent campaign ID
    };

    await expect(updateAdSet(updateInput)).rejects.toThrow(/foreign key constraint/i);
  });
});