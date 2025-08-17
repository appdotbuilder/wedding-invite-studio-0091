import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Upload, 
  Heart, 
  Users, 
  Loader2, 
  AlertCircle, 
  Check,
  Eye
} from 'lucide-react';
import type { User, Project, CreateProjectInput, Template } from '../../../server/src/schema';

interface ProjectBuilderProps {
  project: Project | null; // null for new project, Project for editing
  user: User;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

export function ProjectBuilder({ project, user, onSave, onCancel }: ProjectBuilderProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [subdomainCheck, setSubdomainCheck] = useState<{checking: boolean, available: boolean | null}>({
    checking: false,
    available: null
  });

  // Form data
  const [formData, setFormData] = useState<CreateProjectInput>({
    user_id: user.id,
    reseller_id: user.role === 'reseller' ? user.id : null,
    template_id: 1,
    subdomain: '',
    bride_name: '',
    groom_name: '',
    event_date: new Date(),
    event_time: '14:00',
    venue_name: '',
    venue_address: '',
    venue_latitude: null,
    venue_longitude: null,
    hero_photo_url: null,
    additional_info: null,
    custom_data: null,
  });

  // Load existing project data for editing
  useEffect(() => {
    if (project) {
      setFormData({
        user_id: project.user_id,
        reseller_id: project.reseller_id,
        template_id: project.template_id,
        subdomain: project.subdomain,
        bride_name: project.bride_name,
        groom_name: project.groom_name,
        event_date: project.event_date,
        event_time: project.event_time,
        venue_name: project.venue_name,
        venue_address: project.venue_address,
        venue_latitude: project.venue_latitude,
        venue_longitude: project.venue_longitude,
        hero_photo_url: project.hero_photo_url,
        additional_info: project.additional_info,
        custom_data: project.custom_data,
      });
    }
  }, [project]);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      // STUB: Mock template data
      const mockTemplates: Template[] = [
        {
          id: 1,
          name: 'Elegant Rose',
          description: 'A timeless design with rose gold accents',
          thumbnail_url: '/api/placeholder/300/400?text=Elegant+Rose',
          template_data: '{}',
          is_active: true,
          is_premium: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          name: 'Garden Romance',
          description: 'Botanical elements with soft watercolors',
          thumbnail_url: '/api/placeholder/300/400?text=Garden+Romance',
          template_data: '{}',
          is_active: true,
          is_premium: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          name: 'Classic Marble',
          description: 'Sophisticated marble texture with gold details',
          thumbnail_url: '/api/placeholder/300/400?text=Classic+Marble',
          template_data: '{}',
          is_active: true,
          is_premium: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      setTemplates(mockTemplates);
    };

    loadTemplates();
  }, []);

  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) return;
    
    setSubdomainCheck({ checking: true, available: null });
    
    try {
      // STUB: Mock subdomain check
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate some subdomains being taken
      const takenSubdomains = ['john-jane', 'wedding2024', 'sarah-david'];
      const available = !takenSubdomains.includes(subdomain.toLowerCase());
      
      setSubdomainCheck({ checking: false, available });
    } catch (error) {
      console.error('Subdomain check failed:', error);
      setSubdomainCheck({ checking: false, available: null });
    }
  };

  const generateSubdomain = () => {
    if (formData.bride_name && formData.groom_name) {
      const subdomain = `${formData.bride_name.toLowerCase()}-${formData.groom_name.toLowerCase()}`
        .replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, subdomain }));
      checkSubdomainAvailability(subdomain);
    }
  };

  const handleSubdomainChange = (value: string) => {
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, subdomain: cleanValue }));
    
    if (cleanValue.length >= 3) {
      // Debounced check
      const timeoutId = setTimeout(() => {
        checkSubdomainAvailability(cleanValue);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setSubdomainCheck({ checking: false, available: null });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.bride_name || !formData.groom_name) {
        throw new Error('Please fill in both bride and groom names');
      }
      
      if (!formData.subdomain) {
        throw new Error('Please enter a subdomain');
      }
      
      if (formData.subdomain.length < 3) {
        throw new Error('Subdomain must be at least 3 characters long');
      }

      if (!formData.venue_name || !formData.venue_address) {
        throw new Error('Please fill in venue details');
      }

      // Check subdomain availability one more time
      if (!project && subdomainCheck.available === false) {
        throw new Error('This subdomain is not available');
      }

      // STUB: Mock save operation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const savedProject: Project = {
        id: project?.id || Date.now(), // Mock ID for new projects
        user_id: formData.user_id,
        reseller_id: formData.reseller_id,
        template_id: formData.template_id,
        subdomain: formData.subdomain,
        bride_name: formData.bride_name,
        groom_name: formData.groom_name,
        event_date: formData.event_date,
        event_time: formData.event_time,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        venue_latitude: formData.venue_latitude,
        venue_longitude: formData.venue_longitude,
        hero_photo_url: formData.hero_photo_url,
        additional_info: formData.additional_info,
        custom_data: formData.custom_data,
        status: project?.status || 'draft',
        is_paid: project?.is_paid || false,
        published_at: project?.published_at || null,
        created_at: project?.created_at || new Date(),
        updated_at: new Date(),
      };

      onSave(savedProject);
    } catch (error) {
      console.error('Save failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === formData.template_id);

  return (
    <div className="w-full">
      <DialogHeader className="mb-6">
        <DialogTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-[#7B1E3A]" />
          {project ? 'Edit Wedding Invitation' : 'Create Wedding Invitation'}
        </DialogTitle>
      </DialogHeader>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="details">Wedding Details</TabsTrigger>
          <TabsTrigger value="venue">Venue & Extra</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                      formData.template_id === template.id
                        ? 'border-[#7B1E3A] shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, template_id: template.id }))}
                  >
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Heart className="w-8 h-8 text-[#7B1E3A] mx-auto mb-2" />
                        <p className="text-sm font-medium">{template.name}</p>
                      </div>
                    </div>
                    
                    {formData.template_id === template.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#7B1E3A] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className="p-3">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-gray-600">{template.description}</p>
                      {template.is_premium && (
                        <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTemplate && (
                <div className="mt-6 p-4 bg-[#FDFBF9] rounded-lg">
                  <h4 className="font-semibold text-[#7B1E3A] mb-2">Selected Template:</h4>
                  <p className="text-sm text-gray-600 mb-2">{selectedTemplate.name}</p>
                  <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Couple Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bride-name">Bride's Name *</Label>
                  <Input
                    id="bride-name"
                    value={formData.bride_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bride_name: e.target.value }))}
                    placeholder="Enter bride's name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groom-name">Groom's Name *</Label>
                  <Input
                    id="groom-name"
                    value={formData.groom_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, groom_name: e.target.value }))}
                    placeholder="Enter groom's name"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Wedding Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-date">Wedding Date *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={formData.event_date.toISOString().split('T')[0]}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_date: new Date(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-time">Wedding Time *</Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Website Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Your Wedding Website URL *</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="your-names"
                      className="pr-10"
                      required
                    />
                    {subdomainCheck.checking && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
                    )}
                    {subdomainCheck.available === true && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {subdomainCheck.available === false && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <span className="text-gray-500">.wed.id</span>
                </div>
                
                {subdomainCheck.available === false && (
                  <p className="text-sm text-red-600">This subdomain is already taken</p>
                )}
                
                {subdomainCheck.available === true && (
                  <p className="text-sm text-green-600">Great! This subdomain is available</p>
                )}
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={generateSubdomain}
                  disabled={!formData.bride_name || !formData.groom_name}
                >
                  Generate from Names
                </Button>
                
                {formData.subdomain && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Your wedding website will be:</p>
                    <p className="font-mono text-[#7B1E3A] font-semibold">
                      https://{formData.subdomain}.wed.id
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venue" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Venue Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="venue-name">Venue Name *</Label>
                <Input
                  id="venue-name"
                  value={formData.venue_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue_name: e.target.value }))}
                  placeholder="e.g., Garden Paradise Resort"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="venue-address">Venue Address *</Label>
                <Textarea
                  id="venue-address"
                  value={formData.venue_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue_address: e.target.value }))}
                  placeholder="Full venue address including city and postal code"
                  required
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Photos & Additional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-photo">Hero Photo URL (Optional)</Label>
                <Input
                  id="hero-photo"
                  value={formData.hero_photo_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_photo_url: e.target.value || null }))}
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="text-xs text-gray-500">
                  Add a beautiful photo of you both for the main banner
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additional-info">Additional Information (Optional)</Label>
                <Textarea
                  id="additional-info"
                  value={formData.additional_info || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value || null }))}
                  placeholder="Dress code, special instructions, gift registry, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-between pt-6 border-t mt-6">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isLoading || (formData.subdomain.length >= 3 && subdomainCheck.available === false)}
          className="btn-elegant"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Heart className="mr-2 h-4 w-4" />
              {project ? 'Update Invitation' : 'Create Invitation'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}