import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable, adsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { deleteAd } from '../handlers/delete_ad';
import { eq } from 'drizzle-orm';

// Test input
const testInput: IdInput = {
  id: 1
};

describe('deleteAd', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete an existing ad', async () => {
    // Create prerequisite campaign first
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

    const campaignId = campaignResult[0].id;

    // Create prerequisite ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'General audience'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;

    // Create test ad
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
        destination_url: 'https://example.com'
      })
      .returning()
      .execute();

    const adId = adResult[0].id;

    // Delete the ad
    const result = await deleteAd({ id: adId });

    // Should return true
    expect(result).toBe(true);

    // Verify ad status is updated to 'Deleted'
    const ads = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, adId))
      .execute();

    expect(ads).toHaveLength(1);
    expect(ads[0].status).toEqual('Deleted');
    expect(ads[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return false for non-existent ad', async () => {
    const result = await deleteAd({ id: 999 });

    // Should return false when no ad is found
    expect(result).toBe(false);
  });

  it('should update updated_at timestamp when deleting', async () => {
    // Create prerequisite campaign
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

    const campaignId = campaignResult[0].id;

    // Create prerequisite ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'General audience'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;

    // Create test ad with specific created_at
    const originalTime = new Date('2024-01-01T10:00:00Z');
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
        created_at: originalTime,
        updated_at: originalTime
      })
      .returning()
      .execute();

    const adId = adResult[0].id;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Delete the ad
    const result = await deleteAd({ id: adId });

    expect(result).toBe(true);

    // Verify updated_at is more recent than created_at
    const updatedAds = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, adId))
      .execute();

    expect(updatedAds[0].updated_at > originalTime).toBe(true);
    expect(updatedAds[0].status).toEqual('Deleted');
  });

  it('should work with already deleted ad', async () => {
    // Create prerequisite campaign
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

    const campaignId = campaignResult[0].id;

    // Create prerequisite ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignId,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'General audience'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;

    // Create test ad already deleted
    const adResult = await db.insert(adsTable)
      .values({
        name: 'Test Ad',
        ad_set_id: adSetId,
        status: 'Deleted',
        creative_type: 'Image',
        media_url: 'https://example.com/image.jpg',
        headline: 'Test Headline',
        body_text: 'Test body text',
        call_to_action: 'Learn More',
        destination_url: 'https://example.com'
      })
      .returning()
      .execute();

    const adId = adResult[0].id;

    // Delete the already deleted ad
    const result = await deleteAd({ id: adId });

    // Should still return true since the record exists and gets updated
    expect(result).toBe(true);

    // Verify ad is still marked as deleted
    const ads = await db.select()
      .from(adsTable)
      .where(eq(adsTable.id, adId))
      .execute();

    expect(ads).toHaveLength(1);
    expect(ads[0].status).toEqual('Deleted');
  });
});