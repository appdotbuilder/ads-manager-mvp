import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adsTable, campaignsTable, adSetsTable } from '../db/schema';
import { type CreateAdInput } from '../schema';
import { createAd } from '../handlers/create_ad';
import { eq } from 'drizzle-orm';

// Test data for prerequisites
const testCampaign = {
  name: 'Test Campaign',
  status: 'Active' as const,
  objective: 'Brand Awareness',
  total_budget: '1000.00',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

const testAdSet = {
  name: 'Test Ad Set',
  campaign_id: 1, // Will be set after campaign creation
  status: 'Active' as const,
  daily_budget: '50.00',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  targeting_description: 'Age 18-35, interested in technology'
};

// Complete test input with all required fields
const testInput: CreateAdInput = {
  name: 'Test Ad',
  ad_set_id: 1, // Will be set after ad set creation
  status: 'Active',
  creative_type: 'Image',
  media_url: 'https://example.com/image.jpg',
  headline: 'Amazing Product!',
  body_text: 'Discover our latest innovation that will change your life.',
  call_to_action: 'Shop Now',
  destination_url: 'https://example.com/product'
};

describe('createAd', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values(testCampaign)
      .returning()
      .execute();
    
    // Create prerequisite ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        ...testAdSet,
        campaign_id: campaignResult[0].id
      })
      .returning()
      .execute();
    
    // Update test input with actual ad set ID
    testInput.ad_set_id = adSetResult[0].id;
  });
  
  afterEach(resetDB);

  it('should create an ad with all required fields', async () => {
    const result = await createAd(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Ad');
    expect(result.ad_set_id).toEqual(testInput.ad_set_id);
    expect(result.status).toEqual('Active');
    expect(result.creative_type).toEqual('Image');
    expect(result.media_url).toEqual('https://example.com/image.jpg');
    expect(result.headline).toEqual('Amazing Product!');
    expect(result.body_text).toEqual('Discover our latest innovation that will change your life.');
    expect(result.call_to_action).toEqual('Shop Now');
    expect(result.destination_url).toEqual('https://example.com/product');
    
    // Default metric values
    expect(result.impressions).toEqual(0);
    expect(result.clicks).toEqual(0);
    expect(result.spend).toEqual(0);
    expect(typeof result.spend).toEqual('number'); // Verify numeric conversion
    
    // Auto-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save ad to database correctly', async () => {
    const result = await createAd(testInput);

    // Query the database to verify the ad was saved
    const ads = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, result.id))
      .execute();

    expect(ads).toHaveLength(1);
    const savedAd = ads[0];
    
    expect(savedAd.name).toEqual('Test Ad');
    expect(savedAd.ad_set_id).toEqual(testInput.ad_set_id);
    expect(savedAd.status).toEqual('Active');
    expect(savedAd.creative_type).toEqual('Image');
    expect(savedAd.media_url).toEqual('https://example.com/image.jpg');
    expect(savedAd.headline).toEqual('Amazing Product!');
    expect(savedAd.body_text).toEqual('Discover our latest innovation that will change your life.');
    expect(savedAd.call_to_action).toEqual('Shop Now');
    expect(savedAd.destination_url).toEqual('https://example.com/product');
    
    // Verify numeric field stored as string in database
    expect(typeof savedAd.spend).toEqual('string');
    expect(savedAd.spend).toEqual('0.00');
    expect(parseFloat(savedAd.spend)).toEqual(0);
    
    expect(savedAd.created_at).toBeInstanceOf(Date);
    expect(savedAd.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different creative types correctly', async () => {
    const videoAdInput: CreateAdInput = {
      ...testInput,
      name: 'Video Ad Test',
      creative_type: 'Video',
      media_url: 'https://example.com/video.mp4'
    };

    const result = await createAd(videoAdInput);
    
    expect(result.creative_type).toEqual('Video');
    expect(result.media_url).toEqual('https://example.com/video.mp4');
  });

  it('should handle carousel creative type', async () => {
    const carouselAdInput: CreateAdInput = {
      ...testInput,
      name: 'Carousel Ad Test',
      creative_type: 'Carousel',
      media_url: 'https://example.com/carousel.json'
    };

    const result = await createAd(carouselAdInput);
    
    expect(result.creative_type).toEqual('Carousel');
    expect(result.media_url).toEqual('https://example.com/carousel.json');
  });

  it('should handle paused status correctly', async () => {
    const pausedAdInput: CreateAdInput = {
      ...testInput,
      name: 'Paused Ad Test',
      status: 'Paused'
    };

    const result = await createAd(pausedAdInput);
    
    expect(result.status).toEqual('Paused');
  });

  it('should fail when ad_set_id references non-existent ad set', async () => {
    const invalidInput: CreateAdInput = {
      ...testInput,
      ad_set_id: 99999 // Non-existent ad set ID
    };

    expect(createAd(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });

  it('should handle long text content correctly', async () => {
    const longTextInput: CreateAdInput = {
      ...testInput,
      name: 'Long Content Ad',
      headline: 'This is a very long headline that tests how the system handles extended text content for advertising',
      body_text: 'This is an extremely long body text that describes the product in great detail with multiple sentences and comprehensive information about features, benefits, and call-to-action elements that might be used in real advertising scenarios.',
      call_to_action: 'Learn More About Our Amazing Product'
    };

    const result = await createAd(longTextInput);
    
    expect(result.headline).toEqual(longTextInput.headline);
    expect(result.body_text).toEqual(longTextInput.body_text);
    expect(result.call_to_action).toEqual(longTextInput.call_to_action);
  });
});