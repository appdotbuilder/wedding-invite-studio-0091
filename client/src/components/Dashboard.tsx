import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Heart, 
  Users, 
  Calendar, 
  Eye, 
  Edit, 
  MoreHorizontal, 
  LogOut,
  Settings,
  Crown,
  DollarSign,
  BarChart3,
  FileText
} from 'lucide-react';
import { ProjectBuilder } from './ProjectBuilder';
import { ProjectRsvps } from './ProjectRsvps';
import type { User, Project, UserRole } from '../../../server/src/schema';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectBuilder, setShowProjectBuilder] = useState(false);
  const [showRsvps, setShowRsvps] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's projects
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // STUB: In real implementation, this would call trpc.getProjects.query()
      console.log('Loading projects for user:', user.id, 'role:', user.role);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock project data based on user role
      const mockProjects: Project[] = user.role === 'user' ? [
        {
          id: 1,
          user_id: user.id,
          reseller_id: null,
          template_id: 1,
          subdomain: 'sarah-david',
          bride_name: 'Sarah',
          groom_name: 'David',
          event_date: new Date('2024-06-15'),
          event_time: '14:00',
          venue_name: 'Garden Paradise Resort',
          venue_address: 'Jl. Sunset Road, Bali',
          venue_latitude: -8.6532,
          venue_longitude: 115.1567,
          hero_photo_url: null,
          additional_info: 'Dress code: Formal garden party',
          custom_data: null,
          status: 'published' as const,
          is_paid: true,
          published_at: new Date('2024-03-01'),
          created_at: new Date('2024-02-28'),
          updated_at: new Date('2024-03-01'),
        },
        {
          id: 2,
          user_id: user.id,
          reseller_id: null,
          template_id: 2,
          subdomain: 'lisa-michael',
          bride_name: 'Lisa',
          groom_name: 'Michael',
          event_date: new Date('2024-08-20'),
          event_time: '16:30',
          venue_name: 'Beachfront Villa',
          venue_address: 'Seminyak Beach, Bali',
          venue_latitude: -8.6918,
          venue_longitude: 115.1738,
          hero_photo_url: null,
          additional_info: 'Beach ceremony with sunset reception',
          custom_data: null,
          status: 'draft' as const,
          is_paid: false,
          published_at: null,
          created_at: new Date('2024-03-15'),
          updated_at: new Date('2024-03-15'),
        }
      ] : [];

      setProjects(mockProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowProjectBuilder(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectBuilder(true);
  };

  const handleViewRsvps = (project: Project) => {
    setSelectedProject(project);
    setShowRsvps(true);
  };

  const handleProjectSaved = (project: Project) => {
    if (selectedProject) {
      // Update existing project
      setProjects((prev: Project[]) => 
        prev.map((p: Project) => p.id === project.id ? project : p)
      );
    } else {
      // Add new project
      setProjects((prev: Project[]) => [...prev, project]);
    }
    setShowProjectBuilder(false);
    setSelectedProject(null);
  };

  const getStatusBadge = (status: Project['status']) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline',
    } as const;
    
    return (
      <Badge variant={variants[status]} className={status === 'published' ? 'bg-green-500 hover:bg-green-600' : ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Different dashboard views based on user role
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">856</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 45M</div>
            <p className="text-xs text-muted-foreground">+23% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 this month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Functions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Administrative features would be available here:</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Manage all user accounts and projects</li>
            <li>Create and edit templates</li>
            <li>Monitor system health and analytics</li>
            <li>Process payments and refunds</li>
            <li>Manage reseller programs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const renderResellerDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Projects</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 2.4M</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25%</div>
            <p className="text-xs text-muted-foreground">Standard rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reseller Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCreateProject} className="btn-elegant">
            <Plus className="mr-2 w-4 h-4" />
            Create Project for Client
          </Button>
          <p className="text-gray-600 text-sm">
            Create wedding invitations on behalf of your clients and earn commissions on each sale.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="rings-loader mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-poppins text-xl font-bold text-gray-900">
              Wedding Invite Studio
            </h1>
            {user.role === 'admin' && (
              <Badge className="bg-[#7B1E3A]">
                <Crown className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            {user.role === 'reseller' && (
              <Badge variant="secondary">
                <BarChart3 className="w-3 h-3 mr-1" />
                Reseller
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#7B1E3A] text-white text-sm">
                    {getUserInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#7B1E3A] text-white text-sm">
                    {getUserInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Separator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-poppins text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.full_name.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            {user.role === 'admin' 
              ? 'Manage the platform and view system analytics' 
              : user.role === 'reseller'
              ? 'Create beautiful invitations for your clients'
              : 'Manage your wedding invitations and track RSVPs'
            }
          </p>
        </div>

        {/* Role-specific dashboard content */}
        {user.role === 'admin' && renderAdminDashboard()}
        {user.role === 'reseller' && renderResellerDashboard()}

        {/* User (couple) dashboard - show projects */}
        {user.role === 'user' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateProject} className="btn-elegant">
                  <Plus className="mr-2 w-4 h-4" />
                  Create New Invitation
                </Button>
              </CardContent>
            </Card>

            {/* Projects Grid */}
            <div>
              <h3 className="font-poppins text-xl font-semibold mb-4">Your Wedding Invitations</h3>
              
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No invitations yet</h3>
                    <p className="text-gray-600 mb-6">Create your first beautiful wedding invitation</p>
                    <Button onClick={handleCreateProject} className="btn-elegant">
                      <Plus className="mr-2 w-4 h-4" />
                      Create Your First Invitation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project: Project) => (
                    <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-[4/3] bg-gradient-to-br from-[#F7D1CD] to-[#FDFBF9] relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Heart className="w-8 h-8 text-[#7B1E3A] mx-auto mb-2" />
                            <h4 className="font-poppins font-semibold text-gray-900">
                              {project.bride_name} & {project.groom_name}
                            </h4>
                          </div>
                        </div>
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="absolute top-3 right-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 hover:bg-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditProject(project)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewRsvps(project)}>
                                <Users className="mr-2 h-4 w-4" />
                                View RSVPs
                              </DropdownMenuItem>
                              {project.status === 'published' && (
                                <DropdownMenuItem 
                                  onClick={() => window.open(`https://${project.subdomain}.wed.id`, '_blank')}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Live
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(project.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Eye className="w-4 h-4" />
                          <span>{project.subdomain}.wed.id</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleEditProject(project)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewRsvps(project)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            RSVPs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Project Builder Modal */}
      {showProjectBuilder && (
        <Dialog open={showProjectBuilder} onOpenChange={setShowProjectBuilder}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProjectBuilder
              project={selectedProject}
              user={user}
              onSave={handleProjectSaved}
              onCancel={() => {
                setShowProjectBuilder(false);
                setSelectedProject(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* RSVPs Modal */}
      {showRsvps && selectedProject && (
        <Dialog open={showRsvps} onOpenChange={setShowRsvps}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProjectRsvps
              project={selectedProject}
              onClose={() => {
                setShowRsvps(false);
                setSelectedProject(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}