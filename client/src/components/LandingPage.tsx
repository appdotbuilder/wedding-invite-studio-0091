import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { Heart, Users, Calendar, MapPin, Sparkles, Star, Check, Play, ArrowRight } from 'lucide-react';
import type { Template, Plan } from '../../../server/src/schema';

// Particle component for hero animation
const Particles = () => {
  const [particles, setParticles] = useState<Array<{id: number, left: number, delay: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 6,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // STUB DATA - These would come from API calls in real implementation
  const templates: Template[] = [
    {
      id: 1,
      name: 'Elegant Rose',
      description: 'A timeless design with rose gold accents',
      thumbnail_url: '/api/placeholder/400/600?text=Elegant+Rose',
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
      thumbnail_url: '/api/placeholder/400/600?text=Garden+Romance',
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
      thumbnail_url: '/api/placeholder/400/600?text=Classic+Marble',
      template_data: '{}',
      is_active: true,
      is_premium: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const plans: Plan[] = [
    {
      id: 1,
      name: 'Basic',
      description: 'Perfect for intimate celebrations',
      price: 99000,
      currency: 'IDR',
      features: JSON.stringify([
        'Choose from 5+ templates',
        'Custom couple details',
        'Event information',
        'Basic RSVP system',
        'Mobile responsive',
        '30-day hosting'
      ]),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      name: 'Premium',
      description: 'For the complete wedding experience',
      price: 199000,
      currency: 'IDR',
      features: JSON.stringify([
        'All Basic features',
        'Premium templates',
        'Custom subdomain',
        'Advanced RSVP with guest count',
        'Photo gallery',
        'Wedding countdown',
        'Guest messages',
        '1-year hosting',
        'Priority support'
      ]),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const testimonials = [
    {
      name: 'Sarah & David',
      text: 'Our guests loved the elegant design and the RSVP process was so smooth!',
      rating: 5,
      wedding_date: 'March 2024'
    },
    {
      name: 'Priya & Arjun',
      text: 'The templates are beautiful and the customization options are perfect.',
      rating: 5,
      wedding_date: 'January 2024'
    },
    {
      name: 'Lisa & Michael',
      text: 'Professional, elegant, and our families could easily access everything.',
      rating: 5,
      wedding_date: 'February 2024'
    },
  ];

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'IDR') {
      return `Rp ${price.toLocaleString('id-ID')}`;
    }
    return `${currency} ${price}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden">
        <Particles />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="w-8 h-8 text-[#7B1E3A]" />
              <Badge variant="secondary" className="bg-[#F7D1CD] text-[#7B1E3A] font-medium">
                Trusted by 1000+ Couples
              </Badge>
            </div>
            
            <h1 className="font-poppins text-4xl md:text-6xl lg:text-7xl font-poppins text-gray-900 mb-6 text-shadow">
              Craft Your Dream
              <span className="block bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] bg-clip-text text-transparent">
                Wedding Invitation
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create stunning, personalized wedding invitations that capture your love story. 
              Mobile-responsive, easy to share, and designed to impress your guests.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={onGetStarted}
                className="btn-elegant group"
                size="lg"
              >
                Start Your Invitation
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="border-[#7B1E3A] text-[#7B1E3A] hover:bg-[#7B1E3A] hover:text-white">
                    <Play className="mr-2 w-5 h-5" />
                    Watch Demo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Demo video placeholder</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7B1E3A]" />
                <span>No Design Skills Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7B1E3A]" />
                <span>Mobile Responsive</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#7B1E3A]" />
                <span>Ready in Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Template Showcase */}
      <section className="py-20 bg-[#FDFBF9]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-poppins text-gray-900 mb-4">
              Beautiful Templates for Every Style
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our collection of professionally designed templates, 
              each crafted to make your special day unforgettable.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {templates.map((template) => (
              <Dialog key={template.id}>
                <DialogTrigger asChild>
                  <Card className="template-card cursor-pointer overflow-hidden">
                    <div className="aspect-[3/4] relative">
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-center">
                          <Heart className="w-12 h-12 text-[#7B1E3A] mx-auto mb-2" />
                          <p className="text-sm text-gray-500">{template.name}</p>
                        </div>
                      </div>
                      {template.is_premium && (
                        <Badge className="absolute top-3 right-3 bg-[#7B1E3A]">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-poppins font-semibold text-lg mb-2">{template.name}</h3>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Heart className="w-16 h-16 text-[#7B1E3A] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold">{template.name}</h3>
                        <p className="text-gray-600">Live Preview</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-poppins text-2xl font-poppins mb-4">{template.name}</h3>
                      <p className="text-gray-600 mb-6">{template.description}</p>
                      <Button onClick={onGetStarted} className="btn-elegant">
                        Use This Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-poppins text-gray-900 mb-4">
              Three Simple Steps to Your Perfect Invitation
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Creating your wedding invitation has never been easier. 
              Follow these simple steps and you'll be ready to share in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] rounded-full flex items-center justify-center text-white text-2xl font-poppins mx-auto mb-6">
                1
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-4">Choose Template</h3>
              <p className="text-gray-600">
                Select from our collection of beautiful, professionally designed templates 
                that match your wedding style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] rounded-full flex items-center justify-center text-white text-2xl font-poppins mx-auto mb-6">
                2
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-4">Customize Details</h3>
              <p className="text-gray-600">
                Add your names, wedding details, photos, and personal touches. 
                Our intuitive editor makes it simple.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] rounded-full flex items-center justify-center text-white text-2xl font-poppins mx-auto mb-6">
                3
              </div>
              <h3 className="font-poppins text-xl font-semibold mb-4">Share & Celebrate</h3>
              <p className="text-gray-600">
                Publish your invitation and share the unique link with your guests. 
                Track RSVPs in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-[#FDFBF9]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-poppins text-gray-900 mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Affordable pricing for every couple. Start with our basic plan 
              or go premium for the complete wedding experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.name === 'Premium' ? 'border-[#7B1E3A] shadow-xl' : ''}`}>
                {plan.name === 'Premium' && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#7B1E3A]">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="font-poppins text-2xl font-poppins mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-4xl font-poppins text-[#7B1E3A]">
                      {formatPrice(plan.price, plan.currency)}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {JSON.parse(plan.features).map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={onGetStarted}
                    className={plan.name === 'Premium' ? 'btn-elegant w-full' : 'w-full'}
                    variant={plan.name === 'Premium' ? 'default' : 'outline'}
                  >
                    Get Started with {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-poppins text-3xl md:text-4xl font-poppins text-gray-900 mb-4">
              Loved by Happy Couples
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See what couples are saying about their Wedding Invite Studio experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.wedding_date}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="font-semibold text-gray-900">Ready to create your invitation?</p>
            <p className="text-sm text-gray-600">Join thousands of happy couples</p>
          </div>
          <Button onClick={onGetStarted} className="btn-elegant">
            <Heart className="mr-2 w-4 h-4" />
            Start Your Invitation Now
          </Button>
        </div>
      </div>
    </div>
  );
}