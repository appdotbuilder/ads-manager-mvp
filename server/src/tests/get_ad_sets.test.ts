import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable } from '../db/schema';
import { type CreateCampaignInput, type CreateAdSetInput } from '../schema';
import { getAdSets } from '../handlers/get_ad_sets';

// Test data
const testCampaign: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.50,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

const testAdSet1: CreateAdSetInput = {
  name: 'Test Ad Set 1',
  campaign_id: 1, // Will be updated after campaign creation
  status: 'Active',
  daily_budget: 50.75,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  targeting_description: 'Demographics: 18-35, Interests: Technology'
};

const testAdSet2: CreateAdSetInput = {
  name: 'Test Ad Set 2',
  campaign_id: 1, // Will be updated after campaign creation
  status: 'Paused',
  daily_budget: 25.00,
  start_date: new Date('2024-02-01'),
  end_date: new Date('2024-11-30'),
  targeting_description: 'Demographics: 25-45, Interests: Business'
};

describe('getAdSets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no ad sets exist', async () => {
    const result = await getAdSets();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all ad sets', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: testCampaign.name,
        status: testCampaign.status,
        objective: testCampaign.objective,
        total_budget: testCampaign.total_budget.toString(),
        start_date: testCampaign.start_date,
        end_date: testCampaign.end_date
      })
      .returning()
      .execute();

    const campaignId = campaignResult[0].id;

    // Create test ad sets
    await db.insert(adSetsTable)
      .values([
        {
          name: testAdSet1.name,
          campaign_id: campaignId,
          status: testAdSet1.status,
          daily_budget: testAdSet1.daily_budget.toString(),
          start_date: testAdSet1.start_date,
          end_date: testAdSet1.end_date,
          targeting_description: testAdSet1.targeting_description
        },
        {
          name: testAdSet2.name,
          campaign_id: campaignId,
          status: testAdSet2.status,
          daily_budget: testAdSet2.daily_budget.toString(),
          start_date: testAdSet2.start_date,
          end_date: testAdSet2.end_date,
          targeting_description: testAdSet2.targeting_description
        }
      ])
      .execute();

    const result = await getAdSets();

    expect(result).toHaveLength(2);

    // Verify first ad set
    const adSet1 = result.find(as => as.name === 'Test Ad Set 1');
    expect(adSet1).toBeDefined();
    expect(adSet1!.name).toEqual('Test Ad Set 1');
    expect(adSet1!.campaign_id).toEqual(campaignId);
    expect(adSet1!.status).toEqual('Active');
    expect(adSet1!.daily_budget).toEqual(50.75);
    expect(typeof adSet1!.daily_budget).toBe('number');
    expect(adSet1!.start_date).toEqual(testAdSet1.start_date);
    expect(adSet1!.end_date).toEqual(testAdSet1.end_date);
    expect(adSet1!.targeting_description).toEqual(testAdSet1.targeting_description);
    expect(adSet1!.impressions).toEqual(0);
    expect(adSet1!.clicks).toEqual(0);
    expect(adSet1!.spend).toEqual(0);
    expect(typeof adSet1!.spend).toBe('number');
    expect(adSet1!.id).toBeDefined();
    expect(adSet1!.created_at).toBeInstanceOf(Date);
    expect(adSet1!.updated_at).toBeInstanceOf(Date);

    // Verify second ad set
    const adSet2 = result.find(as => as.name === 'Test Ad Set 2');
    expect(adSet2).toBeDefined();
    expect(adSet2!.name).toEqual('Test Ad Set 2');
    expect(adSet2!.campaign_id).toEqual(campaignId);
    expect(adSet2!.status).toEqual('Paused');
    expect(adSet2!.daily_budget).toEqual(25.00);
    expect(typeof adSet2!.daily_budget).toBe('number');
    expect(adSet2!.targeting_description).toEqual(testAdSet2.targeting_description);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: testCampaign.name,
        status: testCampaign.status,
        objective: testCampaign.objective,
        total_budget: testCampaign.total_budget.toString(),
        start_date: testCampaign.start_date,
        end_date: testCampaign.end_date
      })
      .returning()
      .execute();

    const campaignId = campaignResult[0].id;

    // Create ad set with specific numeric values
    await db.insert(adSetsTable)
      .values({
        name: 'Numeric Test Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '99.99',
        start_date: new Date(),
        end_date: new Date(),
        targeting_description: 'Test targeting',
        spend: '123.45'
      })
      .execute();

    const result = await getAdSets();

    expect(result).toHaveLength(1);
    const adSet = result[0];
    
    // Verify numeric fields are properly converted to numbers
    expect(typeof adSet.daily_budget).toBe('number');
    expect(adSet.daily_budget).toEqual(99.99);
    expect(typeof adSet.spend).toBe('number');
    expect(adSet.spend).toEqual(123.45);
    
    // Integer fields should remain integers
    expect(typeof adSet.impressions).toBe('number');
    expect(typeof adSet.clicks).toBe('number');
    expect(typeof adSet.campaign_id).toBe('number');
  });

  it('should return ad sets with different statuses', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: testCampaign.name,
        status: testCampaign.status,
        objective: testCampaign.objective,
        total_budget: testCampaign.total_budget.toString(),
        start_date: testCampaign.start_date,
        end_date: testCampaign.end_date
      })
      .returning()
      .execute();

    const campaignId = campaignResult[0].id;

    // Create ad sets with different statuses
    await db.insert(adSetsTable)
      .values([
        {
          name: 'Active Ad Set',
          campaign_id: campaignId,
          status: 'Active',
          daily_budget: '10.00',
          start_date: new Date(),
          end_date: new Date(),
          targeting_description: 'Active targeting'
        },
        {
          name: 'Paused Ad Set',
          campaign_id: campaignId,
          status: 'Paused',
          daily_budget: '20.00',
          start_date: new Date(),
          end_date: new Date(),
          targeting_description: 'Paused targeting'
        },
        {
          name: 'Deleted Ad Set',
          campaign_id: campaignId,
          status: 'Deleted',
          daily_budget: '30.00',
          start_date: new Date(),
          end_date: new Date(),
          targeting_description: 'Deleted targeting'
        }
      ])
      .execute();

    const result = await getAdSets();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(adSet => adSet.status).sort();
    expect(statuses).toEqual(['Active', 'Deleted', 'Paused']);
    
    const activeAdSet = result.find(adSet => adSet.status === 'Active');
    const pausedAdSet = result.find(adSet => adSet.status === 'Paused');
    const deletedAdSet = result.find(adSet => adSet.status === 'Deleted');
    
    expect(activeAdSet!.name).toEqual('Active Ad Set');
    expect(pausedAdSet!.name).toEqual('Paused Ad Set');
    expect(deletedAdSet!.name).toEqual('Deleted Ad Set');
  });
});