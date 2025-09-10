import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import { AdSetForm } from '@/components/AdSetForm';
import { trpc } from '@/utils/trpc';
import type { AdSet, Campaign, CreateAdSetInput, UpdateAdSetInput } from '../../../server/src/schema';

interface AdSetManagerProps {
  adSets: AdSet[];
  campaigns: Campaign[];
  onAdSetUpdate: () => Promise<void>;
}

export function AdSetManager({ adSets, campaigns, onAdSetUpdate }: AdSetManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAdSet, setEditingAdSet] = useState<AdSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: CreateAdSetInput) => {
    try {
      setIsLoading(true);
      await trpc.createAdSet.mutate(data);
      await onAdSetUpdate();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create ad set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateAdSetInput) => {
    try {
      setIsLoading(true);
      await trpc.updateAdSet.mutate(data);
      await onAdSetUpdate();
      setEditingAdSet(null);
    } catch (error) {
      console.error('Failed to update ad set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      await trpc.deleteAdSet.mutate({ id });
      await onAdSetUpdate();
    } catch (error) {
      console.error('Failed to delete ad set:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (adSet: AdSet, newStatus: 'Active' | 'Paused') => {
    await handleUpdate({ id: adSet.id, status: newStatus });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Paused': return 'secondary';
      case 'Deleted': return 'destructive';
      default: return 'outline';
    }
  };

  const calculateMetrics = (adSet: AdSet) => {
    const cpm = adSet.impressions > 0 ? (adSet.spend / adSet.impressions) * 1000 : 0;
    const cpc = adSet.clicks > 0 ? adSet.spend / adSet.clicks : 0;
    return { cpm, cpc };
  };

  const getCampaignName = (campaignId: number) => {
    const campaign = campaigns.find((c: Campaign) => c.id === campaignId);
    return campaign ? campaign.name : `Campaign ${campaignId}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Sets</h2>
          <p className="text-muted-foreground">Manage your ad set configurations</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={campaigns.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ad Set
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Ad Set</DialogTitle>
            </DialogHeader>
            <AdSetForm 
              campaigns={campaigns}
              onSubmit={handleCreate}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No campaigns available</h3>
              <p className="text-muted-foreground">Create a campaign first to add ad sets</p>
            </div>
          </CardContent>
        </Card>
      ) : adSets.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">No ad sets yet</h3>
              <p className="text-muted-foreground">Create your first ad set to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Set</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Daily Budget</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adSets.map((adSet: AdSet) => {
                const { cpm, cpc } = calculateMetrics(adSet);
                return (
                  <TableRow key={adSet.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{adSet.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {adSet.targeting_description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getCampaignName(adSet.campaign_id)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(adSet.status)}>
                        {adSet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${adSet.daily_budget.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{adSet.start_date.toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {adSet.end_date.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{adSet.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{adSet.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${adSet.spend.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${cpm.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${cpc.toFixed(2)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {adSet.status === 'Active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(adSet, 'Paused')}
                            >
                              Pause Ad Set
                            </DropdownMenuItem>
                          )}
                          {adSet.status === 'Paused' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(adSet, 'Active')}
                            >
                              Activate Ad Set
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEditingAdSet(adSet)}>
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
                                <AlertDialogTitle>Delete Ad Set</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{adSet.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(adSet.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAdSet} onOpenChange={(open) => !open && setEditingAdSet(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ad Set</DialogTitle>
          </DialogHeader>
          {editingAdSet && (
            <AdSetForm 
              adSet={editingAdSet}
              campaigns={campaigns}
              onSubmit={(data: CreateAdSetInput) => handleUpdate({ id: editingAdSet.id, ...data })}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}