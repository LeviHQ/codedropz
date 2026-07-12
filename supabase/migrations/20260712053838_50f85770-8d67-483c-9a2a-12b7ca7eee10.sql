
CREATE POLICY "anyone can upload share files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'share-files');

CREATE POLICY "anyone can read share files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'share-files');

CREATE POLICY "anyone can delete share files"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'share-files');
