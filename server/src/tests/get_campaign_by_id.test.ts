import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type IdInput, type CreateCampaignInput } from '../schema';
import { getCampaignById } from '../handlers/get_campaign_by_id';

// Test campaign data
const testCampaignInput: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.50,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

describe('getCampaignById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return campaign when ID exists', async () => {
    // Create a test campaign
    const insertResult = await db.insert(campaignsTable)
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

    const createdCampaign = insertResult[0];

    // Test the handler
    const input: IdInput = { id: createdCampaign.id };
    const result = await getCampaignById(input);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(createdCampaign.id);
    expect(result?.name).toEqual('Test Campaign');
    expect(result?.status).toEqual('Active');
    expect(result?.objective).toEqual('Brand Awareness');
    expect(result?.total_budget).toEqual(1000.50);
    expect(typeof result?.total_budget).toEqual('number');
    expect(result?.spend).toEqual(0);
    expect(typeof result?.spend).toEqual('number');
    expect(result?.impressions).toEqual(0);
    expect(result?.clicks).toEqual(0);
    expect(result?.start_date).toBeInstanceOf(Date);
    expect(result?.end_date).toBeInstanceOf(Date);
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    const input: IdInput = { id: 999 };
    const result = await getCampaignById(input);

    expect(result).toBeNull();
  });

  it('should handle campaigns with decimal values correctly', async () => {
    // Create campaign with specific decimal values
    const insertResult = await db.insert(campaignsTable)
      .values({
        name: 'Decimal Test Campaign',
        status: 'Active',
        objective: 'Conversions',
        total_budget: '2500.75',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28'),
        spend: '125.25'
      })
      .returning()
      .execute();

    const createdCampaign = insertResult[0];

    // Test the handler
    const input: IdInput = { id: createdCampaign.id };
    const result = await getCampaignById(input);

    // Validate numeric conversions
    expect(result).not.toBeNull();
    expect(result?.total_budget).toEqual(2500.75);
    expect(typeof result?.total_budget).toEqual('number');
    expect(result?.spend).toEqual(125.25);
    expect(typeof result?.spend).toEqual('number');
  });

  it('should return campaign with different status values', async () => {
    // Test with 'Paused' status
    const insertResult = await db.insert(campaignsTable)
      .values({
        name: 'Paused Campaign',
        status: 'Paused',
        objective: 'Traffic',
        total_budget: '500.00',
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-31')
      })
      .returning()
      .execute();

    const createdCampaign = insertResult[0];

    const input: IdInput = { id: createdCampaign.id };
    const result = await getCampaignById(input);

    expect(result).not.toBeNull();
    expect(result?.status).toEqual('Paused');
    expect(result?.name).toEqual('Paused Campaign');
  });

  it('should verify database query is executed correctly', async () => {
    // Create multiple campaigns
    const campaign1 = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 1',
        status: 'Active',
        objective: 'Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const campaign2 = await db.insert(campaignsTable)
      .values({
        name: 'Campaign 2',
        status: 'Active',
        objective: 'Conversions',
        total_budget: '2000.00',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28')
      })
      .returning()
      .execute();

    // Test that we get the correct specific campaign
    const input: IdInput = { id: campaign2[0].id };
    const result = await getCampaignById(input);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(campaign2[0].id);
    expect(result?.name).toEqual('Campaign 2');
    expect(result?.objective).toEqual('Conversions');
    expect(result?.total_budget).toEqual(2000);
    
    // Ensure we didn't get campaign1 data
    expect(result?.name).not.toEqual('Campaign 1');
  });
});