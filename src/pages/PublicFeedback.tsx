import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';

interface FeedbackPage {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_active: boolean;
}

const PublicFeedback = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState<FeedbackPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('feedback_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setPage(data);
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          message: message.trim(),
          feedback_page_id: page?.id
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Success",
        description: "Thank you for your feedback!"
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The feedback page you're looking for doesn't exist or has been disabled.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <Button onClick={() => {
              setSubmitted(false);
              setMessage('');
            }}>
              Submit Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{page.title}</CardTitle>
              {page.description && (
                <CardDescription className="text-base">
                  {page.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium mb-2">
                  Your Feedback
                </label>
                <Textarea
                  id="feedback"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts, suggestions, or feedback..."
                  rows={6}
                  className="resize-none"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Your feedback is completely anonymous. We cannot identify who submitted it.
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={submitFeedback}
                  disabled={submitting || !message.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              This is an anonymous feedback form. Your identity will not be recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicFeedback;