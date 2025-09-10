import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable, adsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { getAdById } from '../handlers/get_ad_by_id';
import { eq } from 'drizzle-orm';

describe('getAdById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return ad by valid ID', async () => {
    // Create a campaign first
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const campaignId = campaignResult[0].id;

    // Create an ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        targeting_description: 'General targeting'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;

    // Create an ad
    const adResult = await db.insert(adsTable)
      .values({
        name: 'Test Ad',
        ad_set_id: adSetId,
        status: 'Active',
        creative_type: 'Image',
        media_url: 'https://example.com/image.jpg',
        headline: 'Test Headline',
        body_text: 'Test body text',
        call_to_action: 'Learn More',
        destination_url: 'https://example.com',
        impressions: 1000,
        clicks: 50,
        spend: '25.50'
      })
      .returning()
      .execute();

    const createdAd = adResult[0];

    const input: IdInput = { id: createdAd.id };
    const result = await getAdById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAd.id);
    expect(result!.name).toEqual('Test Ad');
    expect(result!.ad_set_id).toEqual(adSetId);
    expect(result!.status).toEqual('Active');
    expect(result!.creative_type).toEqual('Image');
    expect(result!.media_url).toEqual('https://example.com/image.jpg');
    expect(result!.headline).toEqual('Test Headline');
    expect(result!.body_text).toEqual('Test body text');
    expect(result!.call_to_action).toEqual('Learn More');
    expect(result!.destination_url).toEqual('https://example.com');
    expect(result!.impressions).toEqual(1000);
    expect(result!.clicks).toEqual(50);
    expect(result!.spend).toEqual(25.50);
    expect(typeof result!.spend).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent ID', async () => {
    const input: IdInput = { id: 999999 };
    const result = await getAdById(input);

    expect(result).toBeNull();
  });

  it('should handle zero spend correctly', async () => {
    // Create prerequisite data
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        targeting_description: 'General targeting'
      })
      .returning()
      .execute();

    // Create ad with zero spend (default value)
    const adResult = await db.insert(adsTable)
      .values({
        name: 'Zero Spend Ad',
        ad_set_id: adSetResult[0].id,
        status: 'Active',
        creative_type: 'Video',
        media_url: 'https://example.com/video.mp4',
        headline: 'Video Headline',
        body_text: 'Video description',
        call_to_action: 'Watch Now',
        destination_url: 'https://example.com/video'
      })
      .returning()
      .execute();

    const input: IdInput = { id: adResult[0].id };
    const result = await getAdById(input);

    expect(result).not.toBeNull();
    expect(result!.spend).toEqual(0);
    expect(typeof result!.spend).toBe('number');
    expect(result!.creative_type).toEqual('Video');
  });

  it('should handle different creative types correctly', async () => {
    // Create prerequisite data
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        targeting_description: 'General targeting'
      })
      .returning()
      .execute();

    // Create carousel ad
    const carouselAdResult = await db.insert(adsTable)
      .values({
        name: 'Carousel Ad',
        ad_set_id: adSetResult[0].id,
        status: 'Paused',
        creative_type: 'Carousel',
        media_url: 'https://example.com/carousel.json',
        headline: 'Carousel Headline',
        body_text: 'Multiple images showcase',
        call_to_action: 'Shop Now',
        destination_url: 'https://example.com/shop',
        impressions: 2500,
        clicks: 125,
        spend: '75.25'
      })
      .returning()
      .execute();

    const input: IdInput = { id: carouselAdResult[0].id };
    const result = await getAdById(input);

    expect(result).not.toBeNull();
    expect(result!.creative_type).toEqual('Carousel');
    expect(result!.status).toEqual('Paused');
    expect(result!.spend).toEqual(75.25);
    expect(result!.impressions).toEqual(2500);
    expect(result!.clicks).toEqual(125);
  });

  it('should verify ad exists in database after retrieval', async () => {
    // Create prerequisite data
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31')
      })
      .returning()
      .execute();

    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-01-31'),
        targeting_description: 'General targeting'
      })
      .returning()
      .execute();

    const adResult = await db.insert(adsTable)
      .values({
        name: 'Verification Ad',
        ad_set_id: adSetResult[0].id,
        status: 'Active',
        creative_type: 'Image',
        media_url: 'https://example.com/verification.jpg',
        headline: 'Verification Test',
        body_text: 'Testing database consistency',
        call_to_action: 'Click Here',
        destination_url: 'https://example.com/verify'
      })
      .returning()
      .execute();

    const createdAdId = adResult[0].id;

    // Get the ad using the handler
    const handlerResult = await getAdById({ id: createdAdId });

    // Verify the ad exists in database directly
    const dbAds = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, createdAdId))
      .execute();

    expect(handlerResult).not.toBeNull();
    expect(dbAds).toHaveLength(1);
    expect(handlerResult!.id).toEqual(dbAds[0].id);
    expect(handlerResult!.name).toEqual(dbAds[0].name);
    expect(handlerResult!.spend).toEqual(parseFloat(dbAds[0].spend));
  });
});