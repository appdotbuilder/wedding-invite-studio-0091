import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Mail,
  Download,
  Plus,
  Search
} from 'lucide-react';
import type { Project, Rsvp, CreateRsvpInput } from '../../../server/src/schema';

interface ProjectRsvpsProps {
  project: Project;
  onClose: () => void;
}

export function ProjectRsvps({ project, onClose }: ProjectRsvpsProps) {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGuest, setNewGuest] = useState<CreateRsvpInput>({
    project_id: project.id,
    guest_name: '',
    guest_email: null,
    guest_phone: null,
  });
  const [isAddingGuest, setIsAddingGuest] = useState(false);

  // Load RSVPs for this project
  const loadRsvps = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // STUB: Mock RSVP data
      console.log('Loading RSVPs for project:', project.id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockRsvps: Rsvp[] = [
        {
          id: 1,
          project_id: project.id,
          guest_name: 'John & Sarah Smith',
          guest_email: 'john.smith@email.com',
          guest_phone: '+1234567890',
          status: 'yes',
          guest_count: 2,
          message: 'So excited to celebrate with you both!',
          unique_link: 'rsvp-abc123',
          responded_at: new Date('2024-03-10'),
          created_at: new Date('2024-03-01'),
        },
        {
          id: 2,
          project_id: project.id,
          guest_name: 'Emily Johnson',
          guest_email: 'emily.j@email.com',
          guest_phone: null,
          status: 'yes',
          guest_count: 1,
          message: 'Cannot wait! Love you both ❤️',
          unique_link: 'rsvp-def456',
          responded_at: new Date('2024-03-08'),
          created_at: new Date('2024-03-01'),
        },
        {
          id: 3,
          project_id: project.id,
          guest_name: 'The Williams Family',
          guest_email: 'williams@email.com',
          guest_phone: '+1234567891',
          status: 'no',
          guest_count: 0,
          message: 'Unfortunately we cannot make it. Have a wonderful day!',
          unique_link: 'rsvp-ghi789',
          responded_at: new Date('2024-03-12'),
          created_at: new Date('2024-03-01'),
        },
        {
          id: 4,
          project_id: project.id,
          guest_name: 'David & Maria Rodriguez',
          guest_email: 'rodriguez.family@email.com',
          guest_phone: '+1234567892',
          status: 'maybe',
          guest_count: 2,
          message: 'We are hoping to make it! Will confirm closer to the date.',
          unique_link: 'rsvp-jkl012',
          responded_at: new Date('2024-03-11'),
          created_at: new Date('2024-03-01'),
        },
        {
          id: 5,
          project_id: project.id,
          guest_name: 'Alex Thompson',
          guest_email: 'alex.t@email.com',
          guest_phone: null,
          status: 'yes',
          guest_count: 1,
          message: null,
          unique_link: 'rsvp-mno345',
          responded_at: null, // No response yet
          created_at: new Date('2024-03-01'),
        },
      ];
      
      setRsvps(mockRsvps);
    } catch (error) {
      console.error('Failed to load RSVPs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadRsvps();
  }, [loadRsvps]);

  const handleAddGuest = async () => {
    if (!newGuest.guest_name.trim()) return;
    
    setIsAddingGuest(true);
    
    try {
      // STUB: Mock add guest API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockRsvp: Rsvp = {
        id: Date.now(),
        project_id: project.id,
        guest_name: newGuest.guest_name,
        guest_email: newGuest.guest_email,
        guest_phone: newGuest.guest_phone,
        status: 'yes', // Default status for demo
        guest_count: 0,
        message: null,
        unique_link: `rsvp-${Date.now().toString(36)}`,
        responded_at: null,
        created_at: new Date(),
      };
      
      setRsvps(prev => [...prev, mockRsvp]);
      setNewGuest({
        project_id: project.id,
        guest_name: '',
        guest_email: null,
        guest_phone: null,
      });
    } catch (error) {
      console.error('Failed to add guest:', error);
    } finally {
      setIsAddingGuest(false);
    }
  };

  const copyRsvpLink = (rsvp: Rsvp) => {
    const link = `https://${project.subdomain}.wed.id/rsvp/${rsvp.unique_link}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const getStatusIcon = (status: Rsvp['status']) => {
    switch (status) {
      case 'yes':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'no':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'maybe':
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: Rsvp['status']) => {
    const variants = {
      yes: 'default',
      no: 'destructive',
      maybe: 'secondary',
    } as const;
    
    return (
      <Badge variant={variants[status]} className={status === 'yes' ? 'bg-green-500 hover:bg-green-600' : ''}>
        {status === 'yes' ? 'Attending' : status === 'no' ? 'Not Attending' : 'Maybe'}
      </Badge>
    );
  };

  const filteredRsvps = rsvps.filter(rsvp =>
    rsvp.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rsvp.guest_email && rsvp.guest_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const respondedRsvps = rsvps.filter(rsvp => rsvp.responded_at);
  const pendingRsvps = rsvps.filter(rsvp => !rsvp.responded_at);
  const yesCount = rsvps.filter(rsvp => rsvp.status === 'yes').reduce((sum, rsvp) => sum + rsvp.guest_count, 0);
  const noCount = rsvps.filter(rsvp => rsvp.status === 'no').length;
  const maybeCount = rsvps.filter(rsvp => rsvp.status === 'maybe').reduce((sum, rsvp) => sum + rsvp.guest_count, 0);

  if (isLoading) {
    return (
      <div className="w-full">
        <DialogHeader className="mb-6">
          <DialogTitle>Loading RSVPs...</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center py-12">
          <div className="rings-loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DialogHeader className="mb-6">
        <DialogTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#7B1E3A]" />
          RSVPs for {project.bride_name} & {project.groom_name}
        </DialogTitle>
      </DialogHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{yesCount}</div>
            <div className="text-sm text-gray-600">Attending</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{noCount}</div>
            <div className="text-sm text-gray-600">Not Attending</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{maybeCount}</div>
            <div className="text-sm text-gray-600">Maybe</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{pendingRsvps.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({rsvps.length})</TabsTrigger>
          <TabsTrigger value="responded">Responded ({respondedRsvps.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingRsvps.length})</TabsTrigger>
          <TabsTrigger value="add">Add Guest</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Search and Actions */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* RSVP List */}
          <div className="space-y-3">
            {filteredRsvps.map((rsvp) => (
              <Card key={rsvp.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(rsvp.status)}
                        <h4 className="font-medium">{rsvp.guest_name}</h4>
                        {getStatusBadge(rsvp.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {rsvp.guest_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            <span>{rsvp.guest_email}</span>
                          </div>
                        )}
                        
                        {rsvp.status === 'yes' && rsvp.guest_count > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            <span>{rsvp.guest_count} guest{rsvp.guest_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {rsvp.message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm italic">
                            "{rsvp.message}"
                          </div>
                        )}
                        
                        {rsvp.responded_at ? (
                          <div className="text-xs text-gray-500">
                            Responded on {rsvp.responded_at.toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs text-yellow-600 font-medium">
                            No response yet
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyRsvpLink(rsvp)}
                      title="Copy RSVP link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredRsvps.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No matching guests found' : 'No RSVPs yet'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search terms' : 'Add guests to start collecting RSVPs'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="responded" className="space-y-4">
          <div className="space-y-3">
            {respondedRsvps.map((rsvp) => (
              <Card key={rsvp.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(rsvp.status)}
                        <h4 className="font-medium">{rsvp.guest_name}</h4>
                        {getStatusBadge(rsvp.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        {rsvp.status === 'yes' && rsvp.guest_count > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-3 h-3" />
                            <span>{rsvp.guest_count} guest{rsvp.guest_count !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {rsvp.message && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm italic">
                            "{rsvp.message}"
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Responded on {rsvp.responded_at!.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-3">
            {pendingRsvps.map((rsvp) => (
              <Card key={rsvp.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-4 h-4 text-yellow-500" />
                        <h4 className="font-medium">{rsvp.guest_name}</h4>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      
                      {rsvp.guest_email && (
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{rsvp.guest_email}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        Invited on {rsvp.created_at.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyRsvpLink(rsvp)}
                      title="Copy RSVP link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Guest
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="guest-name" className="text-sm font-medium">
                  Guest Name *
                </label>
                <Input
                  id="guest-name"
                  value={newGuest.guest_name}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, guest_name: e.target.value }))}
                  placeholder="e.g., John & Jane Smith"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="guest-email" className="text-sm font-medium">
                  Email (Optional)
                </label>
                <Input
                  id="guest-email"
                  type="email"
                  value={newGuest.guest_email || ''}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, guest_email: e.target.value || null }))}
                  placeholder="guest@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="guest-phone" className="text-sm font-medium">
                  Phone (Optional)
                </label>
                <Input
                  id="guest-phone"
                  value={newGuest.guest_phone || ''}
                  onChange={(e) => setNewGuest(prev => ({ ...prev, guest_phone: e.target.value || null }))}
                  placeholder="+1234567890"
                />
              </div>
              
              <Button 
                onClick={handleAddGuest}
                disabled={isAddingGuest || !newGuest.guest_name.trim()}
                className="btn-elegant w-full"
              >
                {isAddingGuest ? (
                  <>
                    <div className="rings-loader mr-2 w-4 h-4"></div>
                    Adding Guest...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 w-4 h-4" />
                    Add Guest
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-end pt-6 border-t mt-6">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}