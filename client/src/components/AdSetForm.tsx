import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AdSet, Campaign, CreateAdSetInput, Status } from '../../../server/src/schema';

interface AdSetFormProps {
  adSet?: AdSet;
  campaigns: Campaign[];
  onSubmit: (data: CreateAdSetInput) => Promise<void>;
  isLoading?: boolean;
}

export function AdSetForm({ adSet, campaigns, onSubmit, isLoading = false }: AdSetFormProps) {
  const [formData, setFormData] = useState<CreateAdSetInput>({
    name: '',
    campaign_id: campaigns.length > 0 ? campaigns[0].id : 0,
    status: 'Active',
    daily_budget: 0,
    start_date: new Date(),
    end_date: new Date(),
    targeting_description: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (adSet) {
      setFormData({
        name: adSet.name,
        campaign_id: adSet.campaign_id,
        status: adSet.status,
        daily_budget: adSet.daily_budget,
        start_date: adSet.start_date,
        end_date: adSet.end_date,
        targeting_description: adSet.targeting_description
      });
    }
  }, [adSet]);

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
        <Label htmlFor="name">Ad Set Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateAdSetInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Enter ad set name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign_id">Campaign *</Label>
        <Select
          value={formData.campaign_id > 0 ? formData.campaign_id.toString() : ''}
          onValueChange={(value) =>
            setFormData((prev: CreateAdSetInput) => ({ ...prev, campaign_id: parseInt(value) }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign: Campaign) => (
              <SelectItem key={campaign.id} value={campaign.id.toString()}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: Status) =>
            setFormData((prev: CreateAdSetInput) => ({ ...prev, status: value }))
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
        <Label htmlFor="daily_budget">Daily Budget ($) *</Label>
        <Input
          id="daily_budget"
          type="number"
          value={formData.daily_budget}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateAdSetInput) => ({ ...prev, daily_budget: parseFloat(e.target.value) || 0 }))
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
              setFormData((prev: CreateAdSetInput) => ({ ...prev, start_date: new Date(e.target.value) }))
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
              setFormData((prev: CreateAdSetInput) => ({ ...prev, end_date: new Date(e.target.value) }))
            }
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targeting_description">Targeting Description *</Label>
        <Textarea
          id="targeting_description"
          value={formData.targeting_description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateAdSetInput) => ({ ...prev, targeting_description: e.target.value }))
          }
          placeholder="Describe the target audience (e.g., Males, 25-34, USA, interested in tech)"
          required
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : adSet ? 'Update Ad Set' : 'Create Ad Set'}
      </Button>
    </form>
  );
}