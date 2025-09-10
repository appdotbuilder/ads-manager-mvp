import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable, adsTable } from '../db/schema';
import { type IdInput, type CreateCampaignInput, type CreateAdSetInput, type CreateAdInput } from '../schema';
import { getAdsByAdSet } from '../handlers/get_ads_by_ad_set';

describe('getAdsByAdSet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testCampaignInput: CreateCampaignInput = {
    name: 'Test Campaign',
    status: 'Active',
    objective: 'Brand Awareness',
    total_budget: 1000,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31')
  };

  const testAdSetInput: CreateAdSetInput = {
    name: 'Test Ad Set',
    campaign_id: 1, // Will be updated after campaign creation
    status: 'Active',
    daily_budget: 50,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    targeting_description: 'Adults 25-55'
  };

  const testAdInput: CreateAdInput = {
    name: 'Test Ad',
    ad_set_id: 1, // Will be updated after ad set creation
    status: 'Active',
    creative_type: 'Image',
    media_url: 'https://example.com/image.jpg',
    headline: 'Great Product',
    body_text: 'Buy our amazing product',
    call_to_action: 'Shop Now',
    destination_url: 'https://example.com/shop'
  };

  it('should return ads for a specific ad set', async () => {
    // Create campaign first
    const campaign = await db.insert(campaignsTable)
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

    // Create ad set
    const adSet = await db.insert(adSetsTable)
      .values({
        name: testAdSetInput.name,
        campaign_id: campaign[0].id,
        status: testAdSetInput.status,
        daily_budget: testAdSetInput.daily_budget.toString(),
        start_date: testAdSetInput.start_date,
        end_date: testAdSetInput.end_date,
        targeting_description: testAdSetInput.targeting_description
      })
      .returning()
      .execute();

    // Create ads
    const ad1 = await db.insert(adsTable)
      .values({
        name: 'Test Ad 1',
        ad_set_id: adSet[0].id,
        status: testAdInput.status,
        creative_type: testAdInput.creative_type,
        media_url: testAdInput.media_url,
        headline: 'First Ad',
        body_text: testAdInput.body_text,
        call_to_action: testAdInput.call_to_action,
        destination_url: testAdInput.destination_url
      })
      .returning()
      .execute();

    const ad2 = await db.insert(adsTable)
      .values({
        name: 'Test Ad 2',
        ad_set_id: adSet[0].id,
        status: 'Paused',
        creative_type: 'Video',
        media_url: 'https://example.com/video.mp4',
        headline: 'Second Ad',
        body_text: 'Different body text',
        call_to_action: 'Learn More',
        destination_url: 'https://example.com/learn'
      })
      .returning()
      .execute();

    const input: IdInput = { id: adSet[0].id };
    const result = await getAdsByAdSet(input);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test Ad 1');
    expect(result[0].ad_set_id).toEqual(adSet[0].id);
    expect(result[0].headline).toEqual('First Ad');
    expect(result[0].status).toEqual('Active');
    expect(result[0].creative_type).toEqual('Image');
    expect(typeof result[0].spend).toEqual('number');
    expect(result[0].spend).toEqual(0);

    expect(result[1].name).toEqual('Test Ad 2');
    expect(result[1].ad_set_id).toEqual(adSet[0].id);
    expect(result[1].headline).toEqual('Second Ad');
    expect(result[1].status).toEqual('Paused');
    expect(result[1].creative_type).toEqual('Video');
    expect(typeof result[1].spend).toEqual('number');
  });

  it('should return empty array for non-existent ad set', async () => {
    const input: IdInput = { id: 999 };
    const result = await getAdsByAdSet(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for ad set with no ads', async () => {
    // Create campaign first
    const campaign = await db.insert(campaignsTable)
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

    // Create ad set without any ads
    const adSet = await db.insert(adSetsTable)
      .values({
        name: testAdSetInput.name,
        campaign_id: campaign[0].id,
        status: testAdSetInput.status,
        daily_budget: testAdSetInput.daily_budget.toString(),
        start_date: testAdSetInput.start_date,
        end_date: testAdSetInput.end_date,
        targeting_description: testAdSetInput.targeting_description
      })
      .returning()
      .execute();

    const input: IdInput = { id: adSet[0].id };
    const result = await getAdsByAdSet(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return ads for the specified ad set', async () => {
    // Create campaign
    const campaign = await db.insert(campaignsTable)
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

    // Create two ad sets
    const adSet1 = await db.insert(adSetsTable)
      .values({
        name: 'Ad Set 1',
        campaign_id: campaign[0].id,
        status: testAdSetInput.status,
        daily_budget: testAdSetInput.daily_budget.toString(),
        start_date: testAdSetInput.start_date,
        end_date: testAdSetInput.end_date,
        targeting_description: testAdSetInput.targeting_description
      })
      .returning()
      .execute();

    const adSet2 = await db.insert(adSetsTable)
      .values({
        name: 'Ad Set 2',
        campaign_id: campaign[0].id,
        status: testAdSetInput.status,
        daily_budget: testAdSetInput.daily_budget.toString(),
        start_date: testAdSetInput.start_date,
        end_date: testAdSetInput.end_date,
        targeting_description: testAdSetInput.targeting_description
      })
      .returning()
      .execute();

    // Create ads for both ad sets
    await db.insert(adsTable)
      .values({
        name: 'Ad for Set 1',
        ad_set_id: adSet1[0].id,
        status: testAdInput.status,
        creative_type: testAdInput.creative_type,
        media_url: testAdInput.media_url,
        headline: 'Ad Set 1 Headline',
        body_text: testAdInput.body_text,
        call_to_action: testAdInput.call_to_action,
        destination_url: testAdInput.destination_url
      })
      .execute();

    await db.insert(adsTable)
      .values({
        name: 'Ad for Set 2',
        ad_set_id: adSet2[0].id,
        status: testAdInput.status,
        creative_type: testAdInput.creative_type,
        media_url: testAdInput.media_url,
        headline: 'Ad Set 2 Headline',
        body_text: testAdInput.body_text,
        call_to_action: testAdInput.call_to_action,
        destination_url: testAdInput.destination_url
      })
      .execute();

    // Test that we only get ads for the first ad set
    const input: IdInput = { id: adSet1[0].id };
    const result = await getAdsByAdSet(input);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Ad for Set 1');
    expect(result[0].ad_set_id).toEqual(adSet1[0].id);
    expect(result[0].headline).toEqual('Ad Set 1 Headline');
  });
});