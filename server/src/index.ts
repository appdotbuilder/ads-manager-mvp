import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import {
  createCampaignInputSchema,
  updateCampaignInputSchema,
  createAdSetInputSchema,
  updateAdSetInputSchema,
  createAdInputSchema,
  updateAdInputSchema,
  idSchema
} from './schema';

// Import handlers
import { createCampaign } from './handlers/create_campaign';
import { getCampaigns } from './handlers/get_campaigns';
import { getCampaignById } from './handlers/get_campaign_by_id';
import { updateCampaign } from './handlers/update_campaign';
import { deleteCampaign } from './handlers/delete_campaign';

import { createAdSet } from './handlers/create_ad_set';
import { getAdSets } from './handlers/get_ad_sets';
import { getAdSetsByCampaign } from './handlers/get_ad_sets_by_campaign';
import { getAdSetById } from './handlers/get_ad_set_by_id';
import { updateAdSet } from './handlers/update_ad_set';
import { deleteAdSet } from './handlers/delete_ad_set';

import { createAd } from './handlers/create_ad';
import { getAds } from './handlers/get_ads';
import { getAdsByAdSet } from './handlers/get_ads_by_ad_set';
import { getAdById } from './handlers/get_ad_by_id';
import { updateAd } from './handlers/update_ad';
import { deleteAd } from './handlers/delete_ad';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Campaign routes
  createCampaign: publicProcedure
    .input(createCampaignInputSchema)
    .mutation(({ input }) => createCampaign(input)),
  
  getCampaigns: publicProcedure
    .query(() => getCampaigns()),
  
  getCampaignById: publicProcedure
    .input(idSchema)
    .query(({ input }) => getCampaignById(input)),
  
  updateCampaign: publicProcedure
    .input(updateCampaignInputSchema)
    .mutation(({ input }) => updateCampaign(input)),
  
  deleteCampaign: publicProcedure
    .input(idSchema)
    .mutation(({ input }) => deleteCampaign(input)),

  // Ad Set routes
  createAdSet: publicProcedure
    .input(createAdSetInputSchema)
    .mutation(({ input }) => createAdSet(input)),
  
  getAdSets: publicProcedure
    .query(() => getAdSets()),
  
  getAdSetsByCampaign: publicProcedure
    .input(idSchema)
    .query(({ input }) => getAdSetsByCampaign(input)),
  
  getAdSetById: publicProcedure
    .input(idSchema)
    .query(({ input }) => getAdSetById(input)),
  
  updateAdSet: publicProcedure
    .input(updateAdSetInputSchema)
    .mutation(({ input }) => updateAdSet(input)),
  
  deleteAdSet: publicProcedure
    .input(idSchema)
    .mutation(({ input }) => deleteAdSet(input)),

  // Ad routes
  createAd: publicProcedure
    .input(createAdInputSchema)
    .mutation(({ input }) => createAd(input)),
  
  getAds: publicProcedure
    .query(() => getAds()),
  
  getAdsByAdSet: publicProcedure
    .input(idSchema)
    .query(({ input }) => getAdsByAdSet(input)),
  
  getAdById: publicProcedure
    .input(idSchema)
    .query(({ input }) => getAdById(input)),
  
  updateAd: publicProcedure
    .input(updateAdInputSchema)
    .mutation(({ input }) => updateAd(input)),
  
  deleteAd: publicProcedure
    .input(idSchema)
    .mutation(({ input }) => deleteAd(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();