import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Ad, AdSet, Campaign, CreateAdInput, Status, CreativeType } from '../../../server/src/schema';

interface AdFormProps {
  ad?: Ad;
  adSets: AdSet[];
  campaigns: Campaign[];
  onSubmit: (data: CreateAdInput) => Promise<void>;
  isLoading?: boolean;
}

export function AdForm({ ad, adSets, campaigns, onSubmit, isLoading = false }: AdFormProps) {
  const [formData, setFormData] = useState<CreateAdInput>({
    name: '',
    ad_set_id: adSets.length > 0 ? adSets[0].id : 0,
    status: 'Active',
    creative_type: 'Image',
    media_url: '',
    headline: '',
    body_text: '',
    call_to_action: '',
    destination_url: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (ad) {
      setFormData({
        name: ad.name,
        ad_set_id: ad.ad_set_id,
        status: ad.status,
        creative_type: ad.creative_type,
        media_url: ad.media_url,
        headline: ad.headline,
        body_text: ad.body_text,
        call_to_action: ad.call_to_action,
        destination_url: ad.destination_url
      });
    }
  }, [ad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };



  const getCampaignName = (adSetId: number) => {
    const adSet = adSets.find((as: AdSet) => as.id === adSetId);
    if (!adSet) return 'Unknown Campaign';
    const campaign = campaigns.find((c: Campaign) => c.id === adSet.campaign_id);
    return campaign ? campaign.name : `Campaign ${adSet.campaign_id}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ad Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAdInput) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter ad name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: Status) =>
              setFormData((prev: CreateAdInput) => ({ ...prev, status: value }))
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="ad_set_id">Ad Set *</Label>
        <Select
          value={formData.ad_set_id > 0 ? formData.ad_set_id.toString() : ''}
          onValueChange={(value) =>
            setFormData((prev: CreateAdInput) => ({ ...prev, ad_set_id: parseInt(value) }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {adSets.map((adSet: AdSet) => (
              <SelectItem key={adSet.id} value={adSet.id.toString()}>
                <div>
                  <div className="font-medium">{adSet.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {getCampaignName(adSet.id)}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="creative_type">Creative Type *</Label>
          <Select
            value={formData.creative_type || 'Image'}
            onValueChange={(value: CreativeType) =>
              setFormData((prev: CreateAdInput) => ({ ...prev, creative_type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Image">Image</SelectItem>
              <SelectItem value="Video">Video</SelectItem>
              <SelectItem value="Carousel">Carousel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="media_url">Media URL *</Label>
          <Input
            id="media_url"
            type="url"
            value={formData.media_url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAdInput) => ({ ...prev, media_url: e.target.value }))
            }
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={formData.headline}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateAdInput) => ({ ...prev, headline: e.target.value }))
          }
          placeholder="Enter compelling headline"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body_text">Body Text *</Label>
        <Textarea
          id="body_text"
          value={formData.body_text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateAdInput) => ({ ...prev, body_text: e.target.value }))
          }
          placeholder="Enter the main description or body text for the ad"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="call_to_action">Call to Action *</Label>
          <Input
            id="call_to_action"
            value={formData.call_to_action}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAdInput) => ({ ...prev, call_to_action: e.target.value }))
            }
            placeholder="Learn More, Shop Now, etc."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination_url">Destination URL *</Label>
          <Input
            id="destination_url"
            type="url"
            value={formData.destination_url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateAdInput) => ({ ...prev, destination_url: e.target.value }))
            }
            placeholder="https://example.com/landing-page"
            required
          />
        </div>
      </div>

      {/* Preview */}
      {formData.media_url && formData.headline && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
            <div className="aspect-video bg-white rounded flex items-center justify-center overflow-hidden">
              {formData.creative_type === 'Video' ? (
                <video 
                  src={formData.media_url} 
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                />
              ) : (
                <img 
                  src={formData.media_url} 
                  alt={formData.headline}
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
              )}
            </div>
            <div className="space-y-1">
              <div className="font-semibold">{formData.headline}</div>
              <div className="text-sm text-gray-600">{formData.body_text}</div>
              <div className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm">
                {formData.call_to_action}
              </div>
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : ad ? 'Update Ad' : 'Create Ad'}
      </Button>
    </form>
  );
}