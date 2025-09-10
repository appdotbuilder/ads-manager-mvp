import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions for PostgreSQL
export const statusEnum = pgEnum('status', ['Active', 'Paused', 'Deleted']);
export const creativeTypeEnum = pgEnum('creative_type', ['Image', 'Video', 'Carousel']);

// Campaigns table
export const campaignsTable = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  status: statusEnum('status').notNull().default('Active'),
  objective: text('objective').notNull(),
  total_budget: numeric('total_budget', { precision: 10, scale: 2 }).notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  spend: numeric('spend', { precision: 10, scale: 2 }).notNull().default('0.00'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Ad Sets table
export const adSetsTable = pgTable('ad_sets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  campaign_id: integer('campaign_id').notNull().references(() => campaignsTable.id),
  status: statusEnum('status').notNull().default('Active'),
  daily_budget: numeric('daily_budget', { precision: 10, scale: 2 }).notNull(),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  targeting_description: text('targeting_description').notNull(),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  spend: numeric('spend', { precision: 10, scale: 2 }).notNull().default('0.00'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Ads table
export const adsTable = pgTable('ads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ad_set_id: integer('ad_set_id').notNull().references(() => adSetsTable.id),
  status: statusEnum('status').notNull().default('Active'),
  creative_type: creativeTypeEnum('creative_type').notNull(),
  media_url: text('media_url').notNull(),
  headline: text('headline').notNull(),
  body_text: text('body_text').notNull(),
  call_to_action: text('call_to_action').notNull(),
  destination_url: text('destination_url').notNull(),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  spend: numeric('spend', { precision: 10, scale: 2 }).notNull().default('0.00'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const campaignsRelations = relations(campaignsTable, ({ many }) => ({
  adSets: many(adSetsTable),
}));

export const adSetsRelations = relations(adSetsTable, ({ one, many }) => ({
  campaign: one(campaignsTable, {
    fields: [adSetsTable.campaign_id],
    references: [campaignsTable.id],
  }),
  ads: many(adsTable),
}));

export const adsRelations = relations(adsTable, ({ one }) => ({
  adSet: one(adSetsTable, {
    fields: [adsTable.ad_set_id],
    references: [adSetsTable.id],
  }),
}));

// TypeScript types for the tables
export type Campaign = typeof campaignsTable.$inferSelect;
export type NewCampaign = typeof campaignsTable.$inferInsert;
export type AdSet = typeof adSetsTable.$inferSelect;
export type NewAdSet = typeof adSetsTable.$inferInsert;
export type Ad = typeof adsTable.$inferSelect;
export type NewAd = typeof adsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  campaigns: campaignsTable,
  adSets: adSetsTable,
  ads: adsTable,
};