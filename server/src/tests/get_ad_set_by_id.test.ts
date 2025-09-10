import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { getAdSetById } from '../handlers/get_ad_set_by_id';

describe('getAdSetById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an ad set by ID', async () => {
    // Create a campaign first (required for foreign key)
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create an ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.75',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Adults 25-54'
      })
      .returning()
      .execute();

    const input: IdInput = { id: adSetResult[0].id };
    const result = await getAdSetById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(adSetResult[0].id);
    expect(result!.name).toEqual('Test Ad Set');
    expect(result!.campaign_id).toEqual(campaignResult[0].id);
    expect(result!.status).toEqual('Active');
    expect(result!.daily_budget).toEqual(50.75);
    expect(typeof result!.daily_budget).toEqual('number');
    expect(result!.spend).toEqual(0);
    expect(typeof result!.spend).toEqual('number');
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeInstanceOf(Date);
    expect(result!.targeting_description).toEqual('Adults 25-54');
    expect(result!.impressions).toEqual(0);
    expect(result!.clicks).toEqual(0);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ad set ID', async () => {
    const input: IdInput = { id: 999 };
    const result = await getAdSetById(input);

    expect(result).toBeNull();
  });

  it('should handle ad set with custom spend and budget values', async () => {
    // Create a campaign first
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Conversions',
        total_budget: '5000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create an ad set with specific budget and spend values
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'High Budget Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Paused',
        daily_budget: '125.99',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'High-value customers',
        impressions: 5000,
        clicks: 150,
        spend: '234.56'
      })
      .returning()
      .execute();

    const input: IdInput = { id: adSetResult[0].id };
    const result = await getAdSetById(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('High Budget Ad Set');
    expect(result!.status).toEqual('Paused');
    expect(result!.daily_budget).toEqual(125.99);
    expect(typeof result!.daily_budget).toEqual('number');
    expect(result!.spend).toEqual(234.56);
    expect(typeof result!.spend).toEqual('number');
    expect(result!.impressions).toEqual(5000);
    expect(result!.clicks).toEqual(150);
    expect(result!.targeting_description).toEqual('High-value customers');
  });

  it('should handle deleted status ad sets', async () => {
    // Create a campaign first
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Traffic',
        total_budget: '2000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create a deleted ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Deleted Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Deleted',
        daily_budget: '25.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-03-31'),
        targeting_description: 'Test audience'
      })
      .returning()
      .execute();

    const input: IdInput = { id: adSetResult[0].id };
    const result = await getAdSetById(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('Deleted');
    expect(result!.name).toEqual('Deleted Ad Set');
  });
});