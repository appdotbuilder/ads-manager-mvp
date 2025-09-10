import { z } from 'zod';

// Enum definitions
export const statusEnum = z.enum(['Active', 'Paused', 'Deleted']);
export const creativeTypeEnum = z.enum(['Image', 'Video', 'Carousel']);

export type Status = z.infer<typeof statusEnum>;
export type CreativeType = z.infer<typeof creativeTypeEnum>;

// Campaign schemas
export const campaignSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: statusEnum,
  objective: z.string(),
  total_budget: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  impressions: z.number(),
  clicks: z.number(),
  spend: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Campaign = z.infer<typeof campaignSchema>;

export const createCampaignInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  status: statusEnum.default('Active'),
  objective: z.string(),
  total_budget: z.number().positive('Budget must be positive'),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;

export const updateCampaignInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  status: statusEnum.optional(),
  objective: z.string().optional(),
  total_budget: z.number().positive('Budget must be positive').optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type UpdateCampaignInput = z.infer<typeof updateCampaignInputSchema>;

// Ad Set schemas
export const adSetSchema = z.object({
  id: z.number(),
  name: z.string(),
  campaign_id: z.number(),
  status: statusEnum,
  daily_budget: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  targeting_description: z.string(),
  impressions: z.number(),
  clicks: z.number(),
  spend: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AdSet = z.infer<typeof adSetSchema>;

export const createAdSetInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaign_id: z.number(),
  status: statusEnum.default('Active'),
  daily_budget: z.number().positive('Daily budget must be positive'),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  targeting_description: z.string()
});

export type CreateAdSetInput = z.infer<typeof createAdSetInputSchema>;

export const updateAdSetInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  campaign_id: z.number().optional(),
  status: statusEnum.optional(),
  daily_budget: z.number().positive('Daily budget must be positive').optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  targeting_description: z.string().optional()
});

export type UpdateAdSetInput = z.infer<typeof updateAdSetInputSchema>;

// Ad schemas
export const adSchema = z.object({
  id: z.number(),
  name: z.string(),
  ad_set_id: z.number(),
  status: statusEnum,
  creative_type: creativeTypeEnum,
  media_url: z.string(),
  headline: z.string(),
  body_text: z.string(),
  call_to_action: z.string(),
  destination_url: z.string(),
  impressions: z.number(),
  clicks: z.number(),
  spend: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Ad = z.infer<typeof adSchema>;

export const createAdInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ad_set_id: z.number(),
  status: statusEnum.default('Active'),
  creative_type: creativeTypeEnum,
  media_url: z.string().url('Must be a valid URL'),
  headline: z.string(),
  body_text: z.string(),
  call_to_action: z.string(),
  destination_url: z.string().url('Must be a valid URL')
});

export type CreateAdInput = z.infer<typeof createAdInputSchema>;

export const updateAdInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  ad_set_id: z.number().optional(),
  status: statusEnum.optional(),
  creative_type: creativeTypeEnum.optional(),
  media_url: z.string().url('Must be a valid URL').optional(),
  headline: z.string().optional(),
  body_text: z.string().optional(),
  call_to_action: z.string().optional(),
  destination_url: z.string().url('Must be a valid URL').optional()
});

export type UpdateAdInput = z.infer<typeof updateAdInputSchema>;

// Additional schemas for operations
export const idSchema = z.object({
  id: z.number()
});

export type IdInput = z.infer<typeof idSchema>;