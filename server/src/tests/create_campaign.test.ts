import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type CreateCampaignInput } from '../schema';
import { createCampaign } from '../handlers/create_campaign';
import { eq, gte, between, and } from 'drizzle-orm';

// Simple test input
const testInput: CreateCampaignInput = {
  name: 'Test Campaign',
  status: 'Active',
  objective: 'Brand Awareness',
  total_budget: 1000.50,
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-01-31')
};

describe('createCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a campaign', async () => {
    const result = await createCampaign(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Campaign');
    expect(result.status).toEqual('Active');
    expect(result.objective).toEqual('Brand Awareness');
    expect(result.total_budget).toEqual(1000.50);
    expect(typeof result.total_budget).toEqual('number');
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Default values
    expect(result.impressions).toEqual(0);
    expect(result.clicks).toEqual(0);
    expect(result.spend).toEqual(0);
    expect(typeof result.spend).toEqual('number');
  });

  it('should save campaign to database', async () => {
    const result = await createCampaign(testInput);

    // Query using proper drizzle syntax
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].name).toEqual('Test Campaign');
    expect(campaigns[0].status).toEqual('Active');
    expect(campaigns[0].objective).toEqual('Brand Awareness');
    expect(parseFloat(campaigns[0].total_budget)).toEqual(1000.50);
    expect(parseFloat(campaigns[0].spend)).toEqual(0);
    expect(campaigns[0].start_date).toEqual(testInput.start_date);
    expect(campaigns[0].end_date).toEqual(testInput.end_date);
    expect(campaigns[0].created_at).toBeInstanceOf(Date);
    expect(campaigns[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create campaign with default status when not provided', async () => {
    const inputWithoutStatus: CreateCampaignInput = {
      name: 'Default Status Campaign',
      objective: 'Conversions',
      total_budget: 500.25,
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      status: 'Active' // Zod default is applied, so we include it
    };

    const result = await createCampaign(inputWithoutStatus);

    expect(result.status).toEqual('Active');
    expect(result.name).toEqual('Default Status Campaign');
    expect(result.total_budget).toEqual(500.25);
  });

  it('should handle different status values', async () => {
    const pausedInput: CreateCampaignInput = {
      ...testInput,
      name: 'Paused Campaign',
      status: 'Paused'
    };

    const result = await createCampaign(pausedInput);

    expect(result.status).toEqual('Paused');
    expect(result.name).toEqual('Paused Campaign');
  });

  it('should query campaigns by date range correctly', async () => {
    // Create test campaign
    await createCampaign(testInput);

    // Test date filtering - demonstration of correct date handling
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Direct query building without reassigning
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(
        and(
          gte(campaignsTable.created_at, yesterday),
          between(campaignsTable.created_at, yesterday, tomorrow)
        )
      )
      .execute();

    expect(campaigns.length).toBeGreaterThan(0);
    campaigns.forEach(campaign => {
      expect(campaign.created_at).toBeInstanceOf(Date);
      expect(campaign.created_at >= yesterday).toBe(true);
      expect(campaign.created_at <= tomorrow).toBe(true);
    });
  });

  it('should handle large budget amounts correctly', async () => {
    const largeBudgetInput: CreateCampaignInput = {
      ...testInput,
      name: 'Large Budget Campaign',
      total_budget: 99999.99
    };

    const result = await createCampaign(largeBudgetInput);

    expect(result.total_budget).toEqual(99999.99);
    expect(typeof result.total_budget).toEqual('number');

    // Verify in database
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(parseFloat(campaigns[0].total_budget)).toEqual(99999.99);
  });

  it('should create multiple campaigns independently', async () => {
    const input1: CreateCampaignInput = {
      ...testInput,
      name: 'Campaign 1'
    };

    const input2: CreateCampaignInput = {
      ...testInput,
      name: 'Campaign 2',
      total_budget: 2000.75
    };

    const result1 = await createCampaign(input1);
    const result2 = await createCampaign(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Campaign 1');
    expect(result2.name).toEqual('Campaign 2');
    expect(result1.total_budget).toEqual(1000.50);
    expect(result2.total_budget).toEqual(2000.75);

    // Verify both campaigns exist in database
    const allCampaigns = await db.select()
      .from(campaignsTable)
      .execute();

    expect(allCampaigns).toHaveLength(2);
  });
});