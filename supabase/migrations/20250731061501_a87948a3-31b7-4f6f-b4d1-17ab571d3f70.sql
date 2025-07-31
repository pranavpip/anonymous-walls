-- Allow anyone (including anonymous users) to view active feedback pages
CREATE POLICY "Anyone can view active feedback pages" 
ON public.feedback_pages 
FOR SELECT 
USING (is_active = true);