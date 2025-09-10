import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable, adsTable } from '../db/schema';
import { type UpdateAdInput } from '../schema';
import { updateAd } from '../handlers/update_ad';
import { eq } from 'drizzle-orm';

describe('updateAd', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let campaignId: number;
  let adSetId: number;
  let adId: number;

  beforeEach(async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '10000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();
    campaignId = campaignResult[0].id;

    // Create prerequisite ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '100.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Test targeting'
      })
      .returning()
      .execute();
    adSetId = adSetResult[0].id;

    // Create test ad
    const adResult = await db.insert(adsTable)
      .values({
        name: 'Original Ad',
        ad_set_id: adSetId,
        status: 'Active',
        creative_type: 'Image',
        media_url: 'https://example.com/image.jpg',
        headline: 'Original Headline',
        body_text: 'Original body text',
        call_to_action: 'Learn More',
        destination_url: 'https://example.com',
        spend: '50.25'
      })
      .returning()
      .execute();
    adId = adResult[0].id;
  });

  it('should update basic ad fields', async () => {
    const input: UpdateAdInput = {
      id: adId,
      name: 'Updated Ad Name',
      headline: 'Updated Headline',
      body_text: 'Updated body text'
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(adId);
    expect(result!.name).toEqual('Updated Ad Name');
    expect(result!.headline).toEqual('Updated Headline');
    expect(result!.body_text).toEqual('Updated body text');
    expect(result!.status).toEqual('Active'); // Should remain unchanged
    expect(result!.creative_type).toEqual('Image'); // Should remain unchanged
    expect(typeof result!.spend).toEqual('number');
    expect(result!.spend).toEqual(50.25);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update status and creative type', async () => {
    const input: UpdateAdInput = {
      id: adId,
      status: 'Paused',
      creative_type: 'Video'
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('Paused');
    expect(result!.creative_type).toEqual('Video');
    expect(result!.name).toEqual('Original Ad'); // Should remain unchanged
  });

  it('should update URLs', async () => {
    const input: UpdateAdInput = {
      id: adId,
      media_url: 'https://newexample.com/video.mp4',
      destination_url: 'https://newexample.com/landing'
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.media_url).toEqual('https://newexample.com/video.mp4');
    expect(result!.destination_url).toEqual('https://newexample.com/landing');
  });

  it('should update call to action', async () => {
    const input: UpdateAdInput = {
      id: adId,
      call_to_action: 'Buy Now'
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.call_to_action).toEqual('Buy Now');
  });

  it('should update ad_set_id when new ad set exists', async () => {
    // Create another ad set
    const newAdSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Another Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '200.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Different targeting'
      })
      .returning()
      .execute();
    const newAdSetId = newAdSetResult[0].id;

    const input: UpdateAdInput = {
      id: adId,
      ad_set_id: newAdSetId
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.ad_set_id).toEqual(newAdSetId);
  });

  it('should return null when ad does not exist', async () => {
    const input: UpdateAdInput = {
      id: 99999,
      name: 'Updated Name'
    };

    const result = await updateAd(input);

    expect(result).toBeNull();
  });

  it('should throw error when ad_set_id does not exist', async () => {
    const input: UpdateAdInput = {
      id: adId,
      ad_set_id: 99999
    };

    await expect(updateAd(input)).rejects.toThrow(/Ad set with id 99999 does not exist/i);
  });

  it('should save updated ad to database', async () => {
    const input: UpdateAdInput = {
      id: adId,
      name: 'Database Test Ad',
      status: 'Paused',
      headline: 'Database Test Headline'
    };

    await updateAd(input);

    // Verify the changes were saved to database
    const ads = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, adId))
      .execute();

    expect(ads).toHaveLength(1);
    const savedAd = ads[0];
    expect(savedAd.name).toEqual('Database Test Ad');
    expect(savedAd.status).toEqual('Paused');
    expect(savedAd.headline).toEqual('Database Test Headline');
    expect(savedAd.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const input: UpdateAdInput = {
      id: adId,
      headline: 'Only This Changed'
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.headline).toEqual('Only This Changed');
    expect(result!.name).toEqual('Original Ad'); // Should remain unchanged
    expect(result!.body_text).toEqual('Original body text'); // Should remain unchanged
    expect(result!.status).toEqual('Active'); // Should remain unchanged
    expect(result!.creative_type).toEqual('Image'); // Should remain unchanged
  });

  it('should handle multiple field updates correctly', async () => {
    const input: UpdateAdInput = {
      id: adId,
      name: 'Multi Update Ad',
      status: 'Paused',
      creative_type: 'Carousel',
      headline: 'Multi Update Headline',
      body_text: 'Multi update body',
      call_to_action: 'Shop Now',
      media_url: 'https://multi.com/media.jpg',
      destination_url: 'https://multi.com/destination'
    };

    const result = await updateAd(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Multi Update Ad');
    expect(result!.status).toEqual('Paused');
    expect(result!.creative_type).toEqual('Carousel');
    expect(result!.headline).toEqual('Multi Update Headline');
    expect(result!.body_text).toEqual('Multi update body');
    expect(result!.call_to_action).toEqual('Shop Now');
    expect(result!.media_url).toEqual('https://multi.com/media.jpg');
    expect(result!.destination_url).toEqual('https://multi.com/destination');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});