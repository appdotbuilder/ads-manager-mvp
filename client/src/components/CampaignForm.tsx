import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Campaign, CreateCampaignInput, Status } from '../../../server/src/schema';

interface CampaignFormProps {
  campaign?: Campaign;
  onSubmit: (data: CreateCampaignInput) => Promise<void>;
  isLoading?: boolean;
}

export function CampaignForm({ campaign, onSubmit, isLoading = false }: CampaignFormProps) {
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: '',
    status: 'Active',
    objective: '',
    total_budget: 0,
    start_date: new Date(),
    end_date: new Date()
  });

  // Populate form when editing
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        total_budget: campaign.total_budget,
        start_date: campaign.start_date,
        end_date: campaign.end_date
      });
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCampaignInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter campaign name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status || 'Active'}
          onValueChange={(value: Status) =>
            setFormData((prev: CreateCampaignInput) => ({ ...prev, status: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">Objective *</Label>
        <Textarea
          id="objective"
          value={formData.objective}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateCampaignInput) => ({ ...prev, objective: e.target.value }))
          }
          placeholder="Describe the campaign goal (e.g., Increase brand awareness)"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total_budget">Total Budget ($) *</Label>
        <Input
          id="total_budget"
          type="number"
          value={formData.total_budget}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateCampaignInput) => ({ ...prev, total_budget: parseFloat(e.target.value) || 0 }))
          }
          placeholder="0.00"
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formatDateForInput(formData.start_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateCampaignInput) => ({ ...prev, start_date: new Date(e.target.value) }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date *</Label>
          <Input
            id="end_date"
            type="date"
            value={formatDateForInput(formData.end_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateCampaignInput) => ({ ...prev, end_date: new Date(e.target.value) }))
            }
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
      </Button>
    </form>
  );
}