import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { AdForm } from '@/components/AdForm';
import { trpc } from '@/utils/trpc';
import type { Ad, AdSet, Campaign, CreateAdInput, UpdateAdInput } from '../../../server/src/schema';

interface AdManagerProps {
  ads: Ad[];
  adSets: AdSet[];
  campaigns: Campaign[];
  onAdUpdate: () => Promise<void>;
}

export function AdManager({ ads, adSets, campaigns, onAdUpdate }: AdManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: CreateAdInput) => {
    try {
      setIsLoading(true);
      await trpc.createAd.mutate(data);
      await onAdUpdate();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create ad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateAdInput) => {
    try {
      setIsLoading(true);
      await trpc.updateAd.mutate(data);
      await onAdUpdate();
      setEditingAd(null);
    } catch (error) {
      console.error('Failed to update ad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      await trpc.deleteAd.mutate({ id });
      await onAdUpdate();
    } catch (error) {
      console.error('Failed to delete ad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (ad: Ad, newStatus: 'Active' | 'Paused') => {
    await handleUpdate({ id: ad.id, status: newStatus });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Paused': return 'secondary';
      case 'Deleted': return 'destructive';
      default: return 'outline';
    }
  };

  const getCreativeTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Image': return 'default';
      case 'Video': return 'secondary';
      case 'Carousel': return 'outline';
      default: return 'outline';
    }
  };

  const calculateMetrics = (ad: Ad) => {
    const cpm = ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0;
    const cpc = ad.clicks > 0 ? ad.spend / ad.clicks : 0;
    return { cpm, cpc };
  };

  const getAdSetName = (adSetId: number) => {
    const adSet = adSets.find((as: AdSet) => as.id === adSetId);
    return adSet ? adSet.name : `Ad Set ${adSetId}`;
  };

  const getCampaignName = (adSetId: number) => {
    const adSet = adSets.find((as: AdSet) => as.id === adSetId);
    if (!adSet) return 'Unknown Campaign';
    const campaign = campaigns.find((c: Campaign) => c.id === adSet.campaign_id);
    return campaign ? campaign.name : `Campaign ${adSet.campaign_id}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ads</h2>
          <p className="text-muted-foreground">Manage your individual ad creatives</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={adSets.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ad</DialogTitle>
            </DialogHeader>
            <AdForm 
              adSets={adSets}
              campaigns={campaigns}
              onSubmit={handleCreate}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {adSets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No ad sets available</h3>
              <p className="text-muted-foreground">Create an ad set first to add ads</p>
            </div>
          </CardContent>
        </Card>
      ) : ads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No ads yet</h3>
              <p className="text-muted-foreground">Create your first ad to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ads.map((ad: Ad) => {
            const { cpm, cpc } = calculateMetrics(ad);
            return (
              <Card key={ad.id}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Creative Preview */}
                    <div className="space-y-2">
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {ad.media_url ? (
                          ad.creative_type === 'Video' ? (
                            <video 
                              src={ad.media_url} 
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                            />
                          ) : (
                            <img 
                              src={ad.media_url} 
                              alt={ad.headline}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '';
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="text-gray-500 text-sm">Preview not available</div>`;
                                }
                              }}
                            />
                          )
                        ) : (
                          <div className="text-gray-500 text-sm">No media</div>
                        )}
                      </div>
                      <Badge variant={getCreativeTypeBadgeVariant(ad.creative_type)}>
                        {ad.creative_type}
                      </Badge>
                    </div>

                    {/* Ad Content */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{ad.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            {getCampaignName(ad.ad_set_id)} → {getAdSetName(ad.ad_set_id)}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(ad.status)}>
                          {ad.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="font-medium">{ad.headline}</div>
                          <div className="text-sm text-muted-foreground">{ad.body_text}</div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {ad.call_to_action}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{ad.destination_url}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics and Actions */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Impressions</div>
                          <div className="font-semibold">{ad.impressions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Clicks</div>
                          <div className="font-semibold">{ad.clicks.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Spend</div>
                          <div className="font-semibold">${ad.spend.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CPM</div>
                          <div className="font-semibold">${cpm.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CPC</div>
                          <div className="font-semibold">${cpc.toFixed(2)}</div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <MoreHorizontal className="h-4 w-4 mr-2" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {ad.status === 'Active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ad, 'Paused')}
                            >
                              Pause Ad
                            </DropdownMenuItem>
                          )}
                          {ad.status === 'Paused' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(ad, 'Active')}
                            >
                              Activate Ad
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEditingAd(ad)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{ad.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(ad.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAd} onOpenChange={(open) => !open && setEditingAd(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
          </DialogHeader>
          {editingAd && (
            <AdForm 
              ad={editingAd}
              adSets={adSets}
              campaigns={campaigns}
              onSubmit={(data: CreateAdInput) => handleUpdate({ id: editingAd.id, ...data })}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}