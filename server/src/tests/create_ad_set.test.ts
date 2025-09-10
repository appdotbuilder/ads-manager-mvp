import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adSetsTable, campaignsTable } from '../db/schema';
import { type CreateAdSetInput, type CreateCampaignInput } from '../schema';
import { createAdSet } from '../handlers/create_ad_set';
import { eq } from 'drizzle-orm';

// Helper function to create a test campaign
const createTestCampaign = async (): Promise<number> => {
  const campaignInput: CreateCampaignInput = {
    name: 'Test Campaign',
    status: 'Active',
    objective: 'Brand Awareness',
    total_budget: 1000.00,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31')
  };

  const result = await db.insert(campaignsTable)
    .values({
      name: campaignInput.name,
      status: campaignInput.status,
      objective: campaignInput.objective,
      total_budget: campaignInput.total_budget.toString(),
      start_date: campaignInput.start_date,
      end_date: campaignInput.end_date
    })
    .returning()
    .execute();

  return result[0].id;
};

// Test input with all required fields
const createTestInput = async (): Promise<CreateAdSetInput> => {
  const campaignId = await createTestCampaign();
  
  return {
    name: 'Test Ad Set',
    campaign_id: campaignId,
    status: 'Active',
    daily_budget: 50.75,
    start_date: new Date('2024-01-15'),
    end_date: new Date('2024-01-30'),
    targeting_description: 'Adults 25-45 interested in technology'
  };
};

describe('createAdSet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an ad set with all required fields', async () => {
    const testInput = await createTestInput();
    const result = await createAdSet(testInput);

    // Verify all fields are correctly set
    expect(result.name).toEqual('Test Ad Set');
    expect(result.campaign_id).toEqual(testInput.campaign_id);
    expect(result.status).toEqual('Active');
    expect(result.daily_budget).toEqual(50.75);
    expect(typeof result.daily_budget).toEqual('number');
    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.targeting_description).toEqual('Adults 25-45 interested in technology');

    // Verify default metric values
    expect(result.impressions).toEqual(0);
    expect(result.clicks).toEqual(0);
    expect(result.spend).toEqual(0);
    expect(typeof result.spend).toEqual('number');

    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save ad set to database with correct numeric conversions', async () => {
    const testInput = await createTestInput();
    const result = await createAdSet(testInput);

    // Query the database directly to verify storage
    const adSets = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, result.id))
      .execute();

    expect(adSets).toHaveLength(1);
    
    const savedAdSet = adSets[0];
    expect(savedAdSet.name).toEqual('Test Ad Set');
    expect(savedAdSet.campaign_id).toEqual(testInput.campaign_id);
    expect(savedAdSet.status).toEqual('Active');
    expect(parseFloat(savedAdSet.daily_budget)).toEqual(50.75);
    expect(savedAdSet.targeting_description).toEqual('Adults 25-45 interested in technology');
    expect(savedAdSet.impressions).toEqual(0);
    expect(savedAdSet.clicks).toEqual(0);
    expect(parseFloat(savedAdSet.spend)).toEqual(0);
    expect(savedAdSet.created_at).toBeInstanceOf(Date);
    expect(savedAdSet.updated_at).toBeInstanceOf(Date);
  });

  it('should create ad set with paused status', async () => {
    const campaignId = await createTestCampaign();
    const testInput: CreateAdSetInput = {
      name: 'Paused Ad Set',
      campaign_id: campaignId,
      status: 'Paused',
      daily_budget: 25.50,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      targeting_description: 'Women 18-35 in urban areas'
    };

    const result = await createAdSet(testInput);

    expect(result.status).toEqual('Paused');
    expect(result.name).toEqual('Paused Ad Set');
    expect(result.daily_budget).toEqual(25.50);
  });

  it('should handle decimal budget values correctly', async () => {
    const campaignId = await createTestCampaign();
    const testInput: CreateAdSetInput = {
      name: 'Decimal Budget Ad Set',
      campaign_id: campaignId,
      status: 'Active',
      daily_budget: 99.99,
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-03-31'),
      targeting_description: 'High-income professionals'
    };

    const result = await createAdSet(testInput);

    expect(result.daily_budget).toEqual(99.99);
    expect(typeof result.daily_budget).toEqual('number');

    // Verify in database
    const adSets = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, result.id))
      .execute();

    expect(parseFloat(adSets[0].daily_budget)).toEqual(99.99);
  });

  it('should throw error when campaign does not exist', async () => {
    const testInput: CreateAdSetInput = {
      name: 'Invalid Campaign Ad Set',
      campaign_id: 99999, // Non-existent campaign ID
      status: 'Active',
      daily_budget: 30.00,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      targeting_description: 'Test targeting'
    };

    await expect(createAdSet(testInput)).rejects.toThrow(/Campaign with id 99999 not found/i);
  });

  it('should create ad set with minimum valid budget', async () => {
    const campaignId = await createTestCampaign();
    const testInput: CreateAdSetInput = {
      name: 'Minimum Budget Ad Set',
      campaign_id: campaignId,
      status: 'Active',
      daily_budget: 0.01, // Minimum positive value
      start_date: new Date('2024-04-01'),
      end_date: new Date('2024-04-30'),
      targeting_description: 'Budget-conscious targeting'
    };

    const result = await createAdSet(testInput);

    expect(result.daily_budget).toEqual(0.01);
    expect(result.name).toEqual('Minimum Budget Ad Set');
  });

  it('should handle different date ranges correctly', async () => {
    const campaignId = await createTestCampaign();
    const startDate = new Date('2024-06-15T10:30:00Z');
    const endDate = new Date('2024-07-15T18:45:00Z');
    
    const testInput: CreateAdSetInput = {
      name: 'Date Range Ad Set',
      campaign_id: campaignId,
      status: 'Active',
      daily_budget: 75.25,
      start_date: startDate,
      end_date: endDate,
      targeting_description: 'Specific date range targeting'
    };

    const result = await createAdSet(testInput);

    expect(result.start_date).toBeInstanceOf(Date);
    expect(result.end_date).toBeInstanceOf(Date);
    expect(result.start_date.getTime()).toEqual(startDate.getTime());
    expect(result.end_date.getTime()).toEqual(endDate.getTime());
  });
});