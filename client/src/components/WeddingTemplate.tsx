import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  MessageSquare,
  CheckCircle,
  Navigation
} from 'lucide-react';
import type { Project, Rsvp, RespondRsvpInput } from '../../../server/src/schema';

interface WeddingTemplateProps {
  project: Project;
  rsvpLink?: string; // For RSVP pages
}

export function WeddingTemplate({ project, rsvpLink }: WeddingTemplateProps) {
  const [showRsvpForm, setShowRsvpForm] = useState(!!rsvpLink);
  const [rsvpData, setRsvpData] = useState<RespondRsvpInput>({
    unique_link: rsvpLink || '',
    status: 'yes',
    guest_count: 1,
    message: null,
  });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Calculate days until wedding
  const daysUntilWedding = Math.ceil((project.event_date.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // STUB: Mock RSVP submission
      console.log('RSVP submitted:', rsvpData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRsvpSubmitted(true);
    } catch (error) {
      console.error('RSVP submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${project.venue_name}, ${project.venue_address}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  // RSVP Form Component
  const RsvpForm = () => (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        {rsvpSubmitted ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Thank You!</h3>
            <p className="text-gray-600">
              Your RSVP has been recorded. We're {rsvpData.status === 'yes' ? 'excited' : rsvpData.status === 'maybe' ? 'hopeful' : 'sad'} 
              {rsvpData.status !== 'no' && ' to celebrate with you!'}
            </p>
            {rsvpData.status === 'yes' && rsvpData.guest_count > 0 && (
              <p className="text-sm text-gray-500">
                We've noted that {rsvpData.guest_count} guest{rsvpData.guest_count !== 1 ? 's' : ''} will be attending.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleRsvpSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <Heart className="w-8 h-8 text-[#7B1E3A] mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-gray-900">RSVP</h3>
              <p className="text-gray-600">Please let us know if you can join us!</p>
            </div>

            <div className="space-y-2">
              <Label>Will you be attending?</Label>
              <Select 
                value={rsvpData.status} 
                onValueChange={(value: 'yes' | 'no' | 'maybe') =>
                  setRsvpData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">✅ Yes, I'll be there!</SelectItem>
                  <SelectItem value="no">❌ Sorry, can't make it</SelectItem>
                  <SelectItem value="maybe">🤔 Maybe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(rsvpData.status === 'yes' || rsvpData.status === 'maybe') && (
              <div className="space-y-2">
                <Label>How many guests will you bring?</Label>
                <Select 
                  value={rsvpData.guest_count.toString()} 
                  onValueChange={(value) =>
                    setRsvpData(prev => ({ ...prev, guest_count: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(6)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i === 0 ? 'Just me' : i === 1 ? '1 guest' : `${i} guests`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Message for the couple (optional)</Label>
              <Textarea
                value={rsvpData.message || ''}
                onChange={(e) => setRsvpData(prev => ({ ...prev, message: e.target.value || null }))}
                placeholder="Share your excitement, wishes, or any special notes..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full btn-elegant">
              {isSubmitting ? (
                <>
                  <div className="rings-loader mr-2 w-4 h-4"></div>
                  Submitting...
                </>
              ) : (
                'Submit RSVP'
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF9] via-white to-[#F7D1CD]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        {/* Hero photo or gradient background */}
        <div className="absolute inset-0">
          {project.hero_photo_url ? (
            <img 
              src={project.hero_photo_url} 
              alt={`${project.bride_name} & ${project.groom_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#7B1E3A]/20 via-[#F7D1CD]/30 to-[#FDFBF9]"></div>
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* Hearts decoration */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <Heart className="w-6 h-6 fill-current" />
              <Heart className="w-8 h-8 fill-current" />
              <Heart className="w-6 h-6 fill-current" />
            </div>

            {/* Names */}
            <div className="space-y-2">
              <h1 className="font-poppins text-4xl md:text-6xl lg:text-7xl font-bold text-shadow">
                {project.bride_name}
              </h1>
              <div className="text-2xl md:text-3xl font-light">&</div>
              <h1 className="font-poppins text-4xl md:text-6xl lg:text-7xl font-bold text-shadow">
                {project.groom_name}
              </h1>
            </div>

            {/* Wedding Date */}
            <div className="text-xl md:text-2xl font-light">
              are getting married on
            </div>
            <div className="text-2xl md:text-3xl font-semibold">
              {formatDate(project.event_date)}
            </div>

            {/* Countdown */}
            {daysUntilWedding > 0 && (
              <div className="mt-8 p-4 bg-white/20 backdrop-blur-sm rounded-lg">
                <div className="text-3xl md:text-4xl font-bold">{daysUntilWedding}</div>
                <div className="text-lg">days to go!</div>
              </div>
            )}

            {/* RSVP button for main invitation */}
            {!rsvpLink && (
              <div className="mt-12">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="btn-elegant text-lg px-8 py-4">
                      <Heart className="mr-2 w-5 h-5" />
                      RSVP Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>RSVP for Our Wedding</DialogTitle>
                    </DialogHeader>
                    <RsvpForm />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Wedding Details Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Section Title */}
            <div className="text-center mb-16">
              <h2 className="font-poppins text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Wedding Details
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[#7B1E3A] to-[#A52A2A] mx-auto"></div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Date & Time */}
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 text-[#7B1E3A] mx-auto mb-4" />
                <h3 className="font-poppins text-xl font-semibold mb-2">When</h3>
                <p className="text-gray-600 text-lg mb-1">{formatDate(project.event_date)}</p>
                <p className="text-gray-600">{formatTime(project.event_time)}</p>
              </Card>

              {/* Venue */}
              <Card className="p-8 text-center">
                <MapPin className="w-12 h-12 text-[#7B1E3A] mx-auto mb-4" />
                <h3 className="font-poppins text-xl font-semibold mb-2">Where</h3>
                <p className="text-gray-900 font-medium text-lg mb-2">{project.venue_name}</p>
                <p className="text-gray-600 mb-4">{project.venue_address}</p>
                <Button variant="outline" size="sm" onClick={openGoogleMaps}>
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </Card>
            </div>

            {/* Additional Info */}
            {project.additional_info && (
              <Card className="p-8 text-center bg-[#FDFBF9]">
                <MessageSquare className="w-12 h-12 text-[#7B1E3A] mx-auto mb-4" />
                <h3 className="font-poppins text-xl font-semibold mb-4">Additional Information</h3>
                <p className="text-gray-600 whitespace-pre-line">{project.additional_info}</p>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* RSVP Section for dedicated RSVP pages */}
      {rsvpLink && (
        <section className="py-20 bg-gradient-to-br from-[#F7D1CD] to-[#FDFBF9]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-poppins text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                RSVP
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We hope you can join us on our special day! 
                Please let us know if you'll be able to attend.
              </p>
            </div>
            <RsvpForm />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 bg-[#7B1E3A] text-white text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-6 h-6 fill-current" />
            <span className="font-poppins text-xl font-semibold">
              {project.bride_name} & {project.groom_name}
            </span>
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <p className="text-[#F7D1CD] mb-4">
            {formatDate(project.event_date)} • {project.venue_name}
          </p>
          <p className="text-sm text-[#F7D1CD]/80">
            Created with 💕 by Wedding Invite Studio
          </p>
        </div>
      </footer>
    </div>
  );
}