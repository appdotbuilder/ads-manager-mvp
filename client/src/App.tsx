import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { CampaignManager } from '@/components/CampaignManager';
import { AdSetManager } from '@/components/AdSetManager';
import { AdManager } from '@/components/AdManager';
import type { Campaign, AdSet, Ad } from '../../server/src/schema';

function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [campaignsData, adSetsData, adsData] = await Promise.all([
        trpc.getCampaigns.query(),
        trpc.getAdSets.query(),
        trpc.getAds.query()
      ]);
      setCampaigns(campaignsData);
      setAdSets(adSetsData);
      setAds(adsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty arrays on error so the app still renders
      setCampaigns([]);
      setAdSets([]);
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate totals for dashboard
  const totalImpressions = campaigns.reduce((sum: number, c: Campaign) => sum + c.impressions, 0) +
                          adSets.reduce((sum: number, as: AdSet) => sum + as.impressions, 0) +
                          ads.reduce((sum: number, a: Ad) => sum + a.impressions, 0);

  const totalClicks = campaigns.reduce((sum: number, c: Campaign) => sum + c.clicks, 0) +
                     adSets.reduce((sum: number, as: AdSet) => sum + as.clicks, 0) +
                     ads.reduce((sum: number, a: Ad) => sum + a.clicks, 0);

  const totalSpend = campaigns.reduce((sum: number, c: Campaign) => sum + c.spend, 0) +
                    adSets.reduce((sum: number, as: AdSet) => sum + as.spend, 0) +
                    ads.reduce((sum: number, a: Ad) => sum + a.spend, 0);

  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading Ads Manager...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📊 Ads Manager</h1>
          <p className="text-muted-foreground">Manage your campaigns, ad sets, and ads</p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cpm.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${cpc.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            🎯 Campaigns
            <Badge variant="secondary">{campaigns.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ad-sets" className="flex items-center gap-2">
            📋 Ad Sets
            <Badge variant="secondary">{adSets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2">
            📱 Ads
            <Badge variant="secondary">{ads.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <CampaignManager 
            campaigns={campaigns}
            onCampaignUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="ad-sets">
          <AdSetManager 
            adSets={adSets}
            campaigns={campaigns}
            onAdSetUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="ads">
          <AdManager 
            ads={ads}
            adSets={adSets}
            campaigns={campaigns}
            onAdUpdate={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;