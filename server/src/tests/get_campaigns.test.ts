import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { getCampaigns } from '../handlers/get_campaigns';

describe('getCampaigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no campaigns exist', async () => {
    const result = await getCampaigns();
    expect(result).toEqual([]);
  });

  it('should return all campaigns', async () => {
    // Create test campaigns
    await db.insert(campaignsTable)
      .values([
        {
          name: 'Campaign 1',
          status: 'Active',
          objective: 'Brand Awareness',
          total_budget: '1000.00',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
        },
        {
          name: 'Campaign 2', 
          status: 'Paused',
          objective: 'Conversions',
          total_budget: '2500.50',
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-02-28'),
        }
      ])
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(2);
    
    // Verify first campaign
    expect(result[0].name).toEqual('Campaign 1');
    expect(result[0].status).toEqual('Active');
    expect(result[0].objective).toEqual('Brand Awareness');
    expect(result[0].total_budget).toEqual(1000.00);
    expect(typeof result[0].total_budget).toBe('number');
    expect(result[0].spend).toEqual(0.00);
    expect(typeof result[0].spend).toBe('number');
    expect(result[0].impressions).toEqual(0);
    expect(result[0].clicks).toEqual(0);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second campaign
    expect(result[1].name).toEqual('Campaign 2');
    expect(result[1].status).toEqual('Paused');
    expect(result[1].objective).toEqual('Conversions');
    expect(result[1].total_budget).toEqual(2500.50);
    expect(typeof result[1].total_budget).toBe('number');
    expect(result[1].spend).toEqual(0.00);
    expect(typeof result[1].spend).toBe('number');
  });

  it('should handle campaigns with different budgets and spend amounts', async () => {
    // Create campaign with custom spend values
    await db.insert(campaignsTable)
      .values({
        name: 'High Spend Campaign',
        status: 'Active',
        objective: 'Traffic',
        total_budget: '5000.99',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        spend: '1234.56',
        impressions: 50000,
        clicks: 2500
      })
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(1);
    expect(result[0].total_budget).toEqual(5000.99);
    expect(result[0].spend).toEqual(1234.56);
    expect(result[0].impressions).toEqual(50000);
    expect(result[0].clicks).toEqual(2500);
    
    // Verify numeric types
    expect(typeof result[0].total_budget).toBe('number');
    expect(typeof result[0].spend).toBe('number');
  });

  it('should return campaigns ordered by creation time', async () => {
    // Create campaigns with slight time difference
    const firstDate = new Date('2024-01-01');
    const secondDate = new Date('2024-01-02');

    await db.insert(campaignsTable)
      .values({
        name: 'First Campaign',
        status: 'Active',
        objective: 'Brand Awareness',
        total_budget: '1000.00',
        start_date: firstDate,
        end_date: new Date('2024-01-31'),
        created_at: firstDate
      })
      .execute();

    await db.insert(campaignsTable)
      .values({
        name: 'Second Campaign',
        status: 'Active', 
        objective: 'Conversions',
        total_budget: '2000.00',
        start_date: secondDate,
        end_date: new Date('2024-02-28'),
        created_at: secondDate
      })
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(2);
    // Results should maintain insertion order or be ordered by id
    expect(result[0].name).toEqual('First Campaign');
    expect(result[1].name).toEqual('Second Campaign');
  });

  it('should handle all campaign statuses correctly', async () => {
    // Create campaigns with different statuses
    await db.insert(campaignsTable)
      .values([
        {
          name: 'Active Campaign',
          status: 'Active',
          objective: 'Brand Awareness',
          total_budget: '1000.00',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-01-31'),
        },
        {
          name: 'Paused Campaign',
          status: 'Paused',
          objective: 'Traffic',
          total_budget: '2000.00',
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-02-28'),
        },
        {
          name: 'Deleted Campaign',
          status: 'Deleted',
          objective: 'Conversions',
          total_budget: '3000.00',
          start_date: new Date('2024-03-01'),
          end_date: new Date('2024-03-31'),
        }
      ])
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(campaign => campaign.status);
    expect(statuses).toContain('Active');
    expect(statuses).toContain('Paused');
    expect(statuses).toContain('Deleted');
  });
});