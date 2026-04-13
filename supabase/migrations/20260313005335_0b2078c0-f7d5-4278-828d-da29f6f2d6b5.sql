
INSERT INTO storage.buckets (id, name, public) VALUES ('product-photos', 'product-photos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload product photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Anyone can view product photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-photos');
CREATE POLICY "Users can delete own product photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
