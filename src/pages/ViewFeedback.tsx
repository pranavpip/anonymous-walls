import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, ExternalLink, Copy } from 'lucide-react';

interface Feedback {
  id: string;
  message: string;
  created_at: string;
}

interface FeedbackPage {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

const ViewFeedback = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [page, setPage] = useState<FeedbackPage | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user && pageId) {
      fetchPageAndFeedback();
    }
  }, [user, authLoading, pageId]);

  const fetchPageAndFeedback = async () => {
    try {
      // First fetch the page to ensure it belongs to the current user
      const { data: pageData, error: pageError } = await supabase
        .from('feedback_pages')
        .select('*')
        .eq('id', pageId)
        .eq('user_id', user?.id)
        .single();

      if (pageError) throw pageError;
      setPage(pageData);

      // Then fetch the feedback for this page
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .eq('feedback_page_id', pageId)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback page",
        variant: "destructive"
      });
      navigate('/pages');
    } finally {
      setLoading(false);
    }
  };

  const copyPublicUrl = () => {
    const url = `${window.location.origin}/feedback/${page?.slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Public feedback URL copied to clipboard"
    });
  };

  const openPublicPage = () => {
    const url = `/feedback/${page?.slug}`;
    window.open(url, '_blank');
  };

  if (authLoading || loading) {
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
              The feedback page you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/pages')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/pages')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pages
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Page Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {page.title}
                    {page.is_active && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </CardTitle>
                  {page.description && (
                    <CardDescription className="mt-2 text-base">
                      {page.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openPublicPage}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Public Page
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyPublicUrl}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Public URL: /feedback/{page.slug}</p>
                <p>Created: {new Date(page.created_at).toLocaleDateString()}</p>
                <p>Total Feedback: {feedback.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback ({feedback.length})
            </h2>

            {feedback.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No feedback yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Share your feedback page URL to start collecting anonymous feedback.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={openPublicPage}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Public Page
                    </Button>
                    <Button variant="outline" onClick={copyPublicUrl}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              feedback.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Anonymous Feedback #{feedback.length - index}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {item.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewFeedback;