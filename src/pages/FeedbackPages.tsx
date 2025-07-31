import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, ExternalLink, ArrowLeft } from 'lucide-react';

interface FeedbackPage {
  id: string;
  title: string;
  description: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

const FeedbackPages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<FeedbackPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    slug: ''
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load feedback pages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const createPage = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('feedback_pages')
        .insert({
          title: formData.title,
          description: formData.description,
          slug: formData.slug,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Feedback page created successfully"
      });

      setFormData({ title: '', description: '', slug: '' });
      setShowCreateForm(false);
      fetchPages();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create feedback page",
        variant: "destructive"
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Feedback Pages</h1>
              <p className="text-muted-foreground">Create and manage your feedback collection pages</p>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Page
            </Button>
          </div>

          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Feedback Page</CardTitle>
                <CardDescription>
                  Set up a new page to collect anonymous feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g., Product Feedback, Event Survey"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell users what kind of feedback you're looking for..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from title"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Public URL: /feedback/{formData.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createPage}>Create Page</Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {pages.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-lg text-muted-foreground mb-4">
                    No feedback pages yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create your first feedback page to start collecting anonymous feedback
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Page
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pages.map((page) => (
                <Card key={page.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {page.title}
                          {page.is_active && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </CardTitle>
                        {page.description && (
                          <CardDescription className="mt-2">
                            {page.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                        const url = `/feedback/${page.slug}`;
                        window.open(url, '_blank');
                      }}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Page
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>URL: /feedback/{page.slug}</p>
                        <p>Created: {new Date(page.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/pages/${page.id}/feedback`)}
                        >
                          View Feedback
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
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

export default FeedbackPages;