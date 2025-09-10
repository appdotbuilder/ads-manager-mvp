import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable } from '../db/schema';
import { type IdInput, type CreateCampaignInput, type CreateAdSetInput } from '../schema';
import { getAdSetsByCampaign } from '../handlers/get_ad_sets_by_campaign';
import { eq } from 'drizzle-orm';

// Test data
const testCampaign: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.00,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

const testAdSet1: Omit<CreateAdSetInput, 'campaign_id'> = {
  name: 'Ad Set 1',
  status: 'Active',
  daily_budget: 50.00,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-15'),
  targeting_description: 'Men 25-35 interested in fitness'
};

const testAdSet2: Omit<CreateAdSetInput, 'campaign_id'> = {
  name: 'Ad Set 2',
  status: 'Paused',
  daily_budget: 75.50,
  start_date: new Date('2024-01-10'),
  end_date: new Date('2024-01-31'),
  targeting_description: 'Women 30-45 interested in health'
};

describe('getAdSetsByCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all ad sets for a specific campaign', async () => {
    // Create a campaign
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

    const campaign = campaignResult[0];

    // Create ad sets for the campaign
    await db.insert(adSetsTable)
      .values([
        {
          name: testAdSet1.name,
          campaign_id: campaign.id,
          status: testAdSet1.status,
          daily_budget: testAdSet1.daily_budget.toString(),
          start_date: testAdSet1.start_date,
          end_date: testAdSet1.end_date,
          targeting_description: testAdSet1.targeting_description
        },
        {
          name: testAdSet2.name,
          campaign_id: campaign.id,
          status: testAdSet2.status,
          daily_budget: testAdSet2.daily_budget.toString(),
          start_date: testAdSet2.start_date,
          end_date: testAdSet2.end_date,
          targeting_description: testAdSet2.targeting_description
        }
      ])
      .execute();

    // Test the handler
    const input: IdInput = { id: campaign.id };
    const result = await getAdSetsByCampaign(input);

    // Verify results
    expect(result).toHaveLength(2);
    
    // Check first ad set
    const adSet1 = result.find(as => as.name === 'Ad Set 1');
    expect(adSet1).toBeDefined();
    expect(adSet1!.campaign_id).toBe(campaign.id);
    expect(adSet1!.status).toBe('Active');
    expect(adSet1!.daily_budget).toBe(50.00);
    expect(typeof adSet1!.daily_budget).toBe('number');
    expect(adSet1!.spend).toBe(0.00);
    expect(typeof adSet1!.spend).toBe('number');
    expect(adSet1!.targeting_description).toBe('Men 25-35 interested in fitness');
    expect(adSet1!.created_at).toBeInstanceOf(Date);

    // Check second ad set
    const adSet2 = result.find(as => as.name === 'Ad Set 2');
    expect(adSet2).toBeDefined();
    expect(adSet2!.campaign_id).toBe(campaign.id);
    expect(adSet2!.status).toBe('Paused');
    expect(adSet2!.daily_budget).toBe(75.50);
    expect(typeof adSet2!.daily_budget).toBe('number');
    expect(adSet2!.targeting_description).toBe('Women 30-45 interested in health');
  });

  it('should return empty array when campaign has no ad sets', async () => {
    // Create a campaign without ad sets
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

    const campaign = campaignResult[0];

    // Test the handler
    const input: IdInput = { id: campaign.id };
    const result = await getAdSetsByCampaign(input);

    // Should return empty array
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent campaign', async () => {
    // Test with non-existent campaign ID
    const input: IdInput = { id: 999 };
    const result = await getAdSetsByCampaign(input);

    // Should return empty array
    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return ad sets from other campaigns', async () => {
    // Create two campaigns
    const campaign1Result = await db.insert(campaignsTable)
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

    const campaign2Result = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 2',
        status: 'Active',
        objective: 'Lead Generation',
        total_budget: '2000.00',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28')
      })
      .returning()
      .execute();

    const campaign1 = campaign1Result[0];
    const campaign2 = campaign2Result[0];

    // Create ad sets for both campaigns
    await db.insert(adSetsTable)
      .values([
        {
          name: 'Campaign 1 Ad Set',
          campaign_id: campaign1.id,
          status: 'Active',
          daily_budget: '100.00',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
          targeting_description: 'Campaign 1 targeting'
        },
        {
          name: 'Campaign 2 Ad Set',
          campaign_id: campaign2.id,
          status: 'Active',
          daily_budget: '200.00',
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-02-28'),
          targeting_description: 'Campaign 2 targeting'
        }
      ])
      .execute();

    // Test fetching ad sets for campaign 1
    const input: IdInput = { id: campaign1.id };
    const result = await getAdSetsByCampaign(input);

    // Should only return ad sets for campaign 1
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Campaign 1 Ad Set');
    expect(result[0].campaign_id).toBe(campaign1.id);
    expect(result[0].targeting_description).toBe('Campaign 1 targeting');
  });

  it('should handle ad sets with different statuses correctly', async () => {
    // Create a campaign
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

    const campaign = campaignResult[0];

    // Create ad sets with different statuses
    await db.insert(adSetsTable)
      .values([
        {
          name: 'Active Ad Set',
          campaign_id: campaign.id,
          status: 'Active',
          daily_budget: '50.00',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
          targeting_description: 'Active targeting'
        },
        {
          name: 'Paused Ad Set',
          campaign_id: campaign.id,
          status: 'Paused',
          daily_budget: '75.00',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
          targeting_description: 'Paused targeting'
        },
        {
          name: 'Deleted Ad Set',
          campaign_id: campaign.id,
          status: 'Deleted',
          daily_budget: '100.00',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
          targeting_description: 'Deleted targeting'
        }
      ])
      .execute();

    // Test the handler
    const input: IdInput = { id: campaign.id };
    const result = await getAdSetsByCampaign(input);

    // Should return all ad sets regardless of status
    expect(result).toHaveLength(3);
    
    const statuses = result.map(as => as.status);
    expect(statuses).toContain('Active');
    expect(statuses).toContain('Paused');
    expect(statuses).toContain('Deleted');
  });
});