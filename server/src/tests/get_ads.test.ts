import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable, adsTable } from '../db/schema';
import { getAds } from '../handlers/get_ads';

describe('getAds', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no ads exist', async () => {
    const result = await getAds();
    expect(result).toEqual([]);
  });

  it('should fetch all ads from database', async () => {
    // Create prerequisite campaign
    const [campaign] = await db.insert(campaignsTable)
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

    // Create prerequisite ad set
    const [adSet] = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaign.id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Targeting description'
      })
      .returning()
      .execute();

    // Create test ads
    await db.insert(adsTable)
      .values([
        {
          name: 'Test Ad 1',
          ad_set_id: adSet.id,
          status: 'Active',
          creative_type: 'Image',
          media_url: 'https://example.com/image1.jpg',
          headline: 'First Test Ad',
          body_text: 'This is the first test ad',
          call_to_action: 'Learn More',
          destination_url: 'https://example.com',
          impressions: 1000,
          clicks: 50,
          spend: '25.50'
        },
        {
          name: 'Test Ad 2',
          ad_set_id: adSet.id,
          status: 'Paused',
          creative_type: 'Video',
          media_url: 'https://example.com/video1.mp4',
          headline: 'Second Test Ad',
          body_text: 'This is the second test ad',
          call_to_action: 'Shop Now',
          destination_url: 'https://example.com/shop',
          impressions: 2000,
          clicks: 100,
          spend: '75.25'
        }
      ])
      .execute();

    const result = await getAds();

    // Should return 2 ads
    expect(result).toHaveLength(2);

    // Verify first ad
    const ad1 = result.find(ad => ad.name === 'Test Ad 1');
    expect(ad1).toBeDefined();
    expect(ad1!.name).toEqual('Test Ad 1');
    expect(ad1!.ad_set_id).toEqual(adSet.id);
    expect(ad1!.status).toEqual('Active');
    expect(ad1!.creative_type).toEqual('Image');
    expect(ad1!.media_url).toEqual('https://example.com/image1.jpg');
    expect(ad1!.headline).toEqual('First Test Ad');
    expect(ad1!.body_text).toEqual('This is the first test ad');
    expect(ad1!.call_to_action).toEqual('Learn More');
    expect(ad1!.destination_url).toEqual('https://example.com');
    expect(ad1!.impressions).toEqual(1000);
    expect(ad1!.clicks).toEqual(50);
    expect(ad1!.spend).toEqual(25.50);
    expect(typeof ad1!.spend).toEqual('number');
    expect(ad1!.id).toBeDefined();
    expect(ad1!.created_at).toBeInstanceOf(Date);
    expect(ad1!.updated_at).toBeInstanceOf(Date);

    // Verify second ad
    const ad2 = result.find(ad => ad.name === 'Test Ad 2');
    expect(ad2).toBeDefined();
    expect(ad2!.name).toEqual('Test Ad 2');
    expect(ad2!.ad_set_id).toEqual(adSet.id);
    expect(ad2!.status).toEqual('Paused');
    expect(ad2!.creative_type).toEqual('Video');
    expect(ad2!.media_url).toEqual('https://example.com/video1.mp4');
    expect(ad2!.headline).toEqual('Second Test Ad');
    expect(ad2!.body_text).toEqual('This is the second test ad');
    expect(ad2!.call_to_action).toEqual('Shop Now');
    expect(ad2!.destination_url).toEqual('https://example.com/shop');
    expect(ad2!.impressions).toEqual(2000);
    expect(ad2!.clicks).toEqual(100);
    expect(ad2!.spend).toEqual(75.25);
    expect(typeof ad2!.spend).toEqual('number');
    expect(ad2!.id).toBeDefined();
    expect(ad2!.created_at).toBeInstanceOf(Date);
    expect(ad2!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle ads with different statuses and creative types', async () => {
    // Create prerequisite campaign
    const [campaign] = await db.insert(campaignsTable)
      .values({
        name: 'Status Test Campaign',
        status: 'Active',
        objective: 'Conversions',
        total_budget: '2000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create prerequisite ad set
    const [adSet] = await db.insert(adSetsTable)
      .values({
        name: 'Status Test Ad Set',
        campaign_id: campaign.id,
        status: 'Active',
        daily_budget: '100.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Status testing targeting'
      })
      .returning()
      .execute();

    // Create ads with different statuses and creative types
    await db.insert(adsTable)
      .values([
        {
          name: 'Active Image Ad',
          ad_set_id: adSet.id,
          status: 'Active',
          creative_type: 'Image',
          media_url: 'https://example.com/active.jpg',
          headline: 'Active Image Headline',
          body_text: 'Active image body',
          call_to_action: 'Click Here',
          destination_url: 'https://example.com/active',
          spend: '0.00'
        },
        {
          name: 'Paused Video Ad',
          ad_set_id: adSet.id,
          status: 'Paused',
          creative_type: 'Video',
          media_url: 'https://example.com/paused.mp4',
          headline: 'Paused Video Headline',
          body_text: 'Paused video body',
          call_to_action: 'Watch Now',
          destination_url: 'https://example.com/paused',
          spend: '15.75'
        },
        {
          name: 'Deleted Carousel Ad',
          ad_set_id: adSet.id,
          status: 'Deleted',
          creative_type: 'Carousel',
          media_url: 'https://example.com/deleted.jpg',
          headline: 'Deleted Carousel Headline',
          body_text: 'Deleted carousel body',
          call_to_action: 'Browse',
          destination_url: 'https://example.com/deleted',
          spend: '99.99'
        }
      ])
      .execute();

    const result = await getAds();

    expect(result).toHaveLength(3);

    // Verify all statuses are returned
    const statuses = result.map(ad => ad.status).sort();
    expect(statuses).toEqual(['Active', 'Deleted', 'Paused']);

    // Verify all creative types are returned
    const creativeTypes = result.map(ad => ad.creative_type).sort();
    expect(creativeTypes).toEqual(['Carousel', 'Image', 'Video']);

    // Verify numeric conversion worked correctly
    result.forEach(ad => {
      expect(typeof ad.spend).toEqual('number');
    });
  });

  it('should handle zero and default values correctly', async () => {
    // Create prerequisite campaign
    const [campaign] = await db.insert(campaignsTable)
      .values({
        name: 'Default Values Campaign',
        status: 'Active',
        objective: 'Traffic',
        total_budget: '500.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create prerequisite ad set
    const [adSet] = await db.insert(adSetsTable)
      .values({
        name: 'Default Values Ad Set',
        campaign_id: campaign.id,
        status: 'Active',
        daily_budget: '25.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Default values targeting'
      })
      .returning()
      .execute();

    // Create ad with default/zero values (relying on database defaults)
    const [insertedAd] = await db.insert(adsTable)
      .values({
        name: 'Default Values Ad',
        ad_set_id: adSet.id,
        creative_type: 'Image',
        media_url: 'https://example.com/default.jpg',
        headline: 'Default Headline',
        body_text: 'Default body text',
        call_to_action: 'Default CTA',
        destination_url: 'https://example.com/default'
        // Omitting status, impressions, clicks, spend to use defaults
      })
      .returning()
      .execute();

    const result = await getAds();

    expect(result).toHaveLength(1);
    const ad = result[0];

    // Verify default values
    expect(ad.status).toEqual('Active'); // Default status
    expect(ad.impressions).toEqual(0); // Default impressions
    expect(ad.clicks).toEqual(0); // Default clicks
    expect(ad.spend).toEqual(0); // Default spend converted to number
    expect(typeof ad.spend).toEqual('number');
  });
});