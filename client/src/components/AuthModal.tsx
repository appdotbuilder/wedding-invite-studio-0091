import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import type { CreateUserInput, LoginInput, UserRole } from '../../../server/src/schema';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginInput>({
    email: '',
    password: '',
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState<CreateUserInput>({
    email: '',
    password: '',
    full_name: '',
    role: 'user', // Default to 'user' role for couples
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // STUB: In real implementation, this would authenticate with backend
      // For now, we'll simulate a successful login
      console.log('Login attempt:', loginForm);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful user data
      const mockUser = {
        id: 1,
        email: loginForm.email,
        full_name: 'Demo User',
        role: 'user' as UserRole,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      onAuthSuccess(mockUser);
      onClose();
      
      // Reset form
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // STUB: In real implementation, this would call the createUser API
      console.log('Registration attempt:', registerForm);
      
      // Basic validation
      if (registerForm.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful registration and immediate login
      const mockUser = {
        id: 2,
        email: registerForm.email,
        full_name: registerForm.full_name,
        role: registerForm.role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      onAuthSuccess(mockUser);
      onClose();
      
      // Reset form
      setRegisterForm({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
      });
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'login' | 'register');
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] rounded-full flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-poppins">
            Welcome to Wedding Invite Studio
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="login" className="space-y-4 mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={loginForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginForm((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Your password"
                  value={loginForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginForm((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full btn-elegant"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-600">
              <p className="mb-2">Demo credentials for testing:</p>
              <p><strong>Email:</strong> demo@example.com</p>
              <p><strong>Password:</strong> demo123456</p>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Your full name"
                  value={registerForm.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterForm((prev: CreateUserInput) => ({ ...prev, full_name: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={registerForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-role">I am a</Label>
                <Select 
                  value={registerForm.role} 
                  onValueChange={(value: UserRole) =>
                    setRegisterForm((prev: CreateUserInput) => ({ ...prev, role: value }))
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Couple getting married</SelectItem>
                    <SelectItem value="reseller">Wedding vendor/reseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-elegant"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-gray-500 mt-6">
          <p>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}