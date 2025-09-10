import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, adSetsTable, adsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { deleteAdSet } from '../handlers/delete_ad_set';
import { eq } from 'drizzle-orm';

describe('deleteAdSet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark an ad set as deleted', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        objective: 'awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create test ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Test targeting'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;
    const input: IdInput = { id: adSetId };

    const result = await deleteAdSet(input);

    expect(result).toBe(true);

    // Verify ad set is marked as deleted
    const updatedAdSet = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, adSetId))
      .execute();

    expect(updatedAdSet).toHaveLength(1);
    expect(updatedAdSet[0].status).toBe('Deleted');
    expect(updatedAdSet[0].updated_at).toBeInstanceOf(Date);
  });

  it('should mark all associated ads as deleted', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        objective: 'awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create test ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Test targeting'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;

    // Create multiple test ads
    await db.insert(adsTable)
      .values([
        {
          name: 'Test Ad 1',
          ad_set_id: adSetId,
          status: 'Active',
          creative_type: 'Image',
          media_url: 'https://example.com/image1.jpg',
          headline: 'Test Headline 1',
          body_text: 'Test body text 1',
          call_to_action: 'Click Here',
          destination_url: 'https://example.com'
        },
        {
          name: 'Test Ad 2',
          ad_set_id: adSetId,
          status: 'Paused',
          creative_type: 'Video',
          media_url: 'https://example.com/video.mp4',
          headline: 'Test Headline 2',
          body_text: 'Test body text 2',
          call_to_action: 'Learn More',
          destination_url: 'https://example.com'
        }
      ])
      .execute();

    const input: IdInput = { id: adSetId };

    const result = await deleteAdSet(input);

    expect(result).toBe(true);

    // Verify all associated ads are marked as deleted
    const updatedAds = await db.select()
      .from(adsTable)
      .where(eq(adsTable.ad_set_id, adSetId))
      .execute();

    expect(updatedAds).toHaveLength(2);
    updatedAds.forEach(ad => {
      expect(ad.status).toBe('Deleted');
      expect(ad.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return false when ad set does not exist', async () => {
    const nonExistentId = 99999;
    const input: IdInput = { id: nonExistentId };

    const result = await deleteAdSet(input);

    expect(result).toBe(false);
  });

  it('should handle ad set with no associated ads', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        objective: 'awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create test ad set with no ads
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set No Ads',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Test targeting'
      })
      .returning()
      .execute();

    const adSetId = adSetResult[0].id;
    const input: IdInput = { id: adSetId };

    const result = await deleteAdSet(input);

    expect(result).toBe(true);

    // Verify ad set is marked as deleted
    const updatedAdSet = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, adSetId))
      .execute();

    expect(updatedAdSet).toHaveLength(1);
    expect(updatedAdSet[0].status).toBe('Deleted');
  });

  it('should update updated_at timestamp on both ad set and ads', async () => {
    // Create prerequisite campaign
    const campaignResult = await db.insert(campaignsTable)
      .values({
        name: 'Test Campaign',
        objective: 'awareness',
        total_budget: '1000.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create test ad set
    const adSetResult = await db.insert(adSetsTable)
      .values({
        name: 'Test Ad Set',
        campaign_id: campaignResult[0].id,
        status: 'Active',
        daily_budget: '50.00',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        targeting_description: 'Test targeting'
      })
      .returning()
      .execute();

    const originalUpdatedAt = adSetResult[0].updated_at;
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
        call_to_action: 'Click Here',
        destination_url: 'https://example.com'
      })
      .returning()
      .execute();

    const originalAdUpdatedAt = adResult[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: IdInput = { id: adSetId };
    await deleteAdSet(input);

    // Verify updated_at timestamps were updated
    const updatedAdSet = await db.select()
      .from(adSetsTable)
      .where(eq(adSetsTable.id, adSetId))
      .execute();

    const updatedAd = await db.select()
      .from(adsTable)
      .where(eq(adsTable.ad_set_id, adSetId))
      .execute();

    expect(updatedAdSet[0].updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(updatedAd[0].updated_at.getTime()).toBeGreaterThan(originalAdUpdatedAt.getTime());
  });
});