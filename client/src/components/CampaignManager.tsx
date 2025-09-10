import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Edit, Trash2 } from 'lucide-react';
import { CampaignForm } from '@/components/CampaignForm';
import { trpc } from '@/utils/trpc';
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from '../../../server/src/schema';

interface CampaignManagerProps {
  campaigns: Campaign[];
  onCampaignUpdate: () => Promise<void>;
}

export function CampaignManager({ campaigns, onCampaignUpdate }: CampaignManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (data: CreateCampaignInput) => {
    try {
      setIsLoading(true);
      await trpc.createCampaign.mutate(data);
      await onCampaignUpdate();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateCampaignInput) => {
    try {
      setIsLoading(true);
      await trpc.updateCampaign.mutate(data);
      await onCampaignUpdate();
      setEditingCampaign(null);
    } catch (error) {
      console.error('Failed to update campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      await trpc.deleteCampaign.mutate({ id });
      await onCampaignUpdate();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (campaign: Campaign, newStatus: 'Active' | 'Paused') => {
    await handleUpdate({ id: campaign.id, status: newStatus });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Paused': return 'secondary';
      case 'Deleted': return 'destructive';
      default: return 'outline';
    }
  };

  const calculateMetrics = (campaign: Campaign) => {
    const cpm = campaign.impressions > 0 ? (campaign.spend / campaign.impressions) * 1000 : 0;
    const cpc = campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0;
    return { cpm, cpc };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-muted-foreground">Manage your advertising campaigns</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm 
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
              <h3 className="text-lg font-semibold">No campaigns yet</h3>
              <p className="text-muted-foreground">Create your first campaign to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
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
              {campaigns.map((campaign: Campaign) => {
                const { cpm, cpc } = calculateMetrics(campaign);
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="text-sm text-muted-foreground">{campaign.objective}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${campaign.total_budget.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{campaign.start_date.toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {campaign.end_date.toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{campaign.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaign.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${campaign.spend.toFixed(2)}</TableCell>
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
                          {campaign.status === 'Active' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(campaign, 'Paused')}
                            >
                              Pause Campaign
                            </DropdownMenuItem>
                          )}
                          {campaign.status === 'Paused' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(campaign, 'Active')}
                            >
                              Activate Campaign
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
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
                                <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{campaign.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(campaign.id)}>
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
      <Dialog open={!!editingCampaign} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          {editingCampaign && (
            <CampaignForm 
              campaign={editingCampaign}
              onSubmit={(data: CreateCampaignInput) => handleUpdate({ id: editingCampaign.id, ...data })}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}