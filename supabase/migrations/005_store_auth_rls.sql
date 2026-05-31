-- 店舗認証・RLS（自店データのみ書き込み可能）

-- store_accounts
CREATE POLICY "Users read own store account"
  ON store_accounts FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users link own account to store"
  ON store_accounts FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM store_accounts sa WHERE sa.store_id = store_accounts.store_id
    )
  );

-- stores: 登録（OSM経由）と自店更新
CREATE POLICY "Authenticated register store via OSM"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    osm_type IS NOT NULL
    AND osm_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM stores s
      WHERE s.osm_type = stores.osm_type AND s.osm_id = stores.osm_id
    )
  );

CREATE POLICY "Store owners update own store"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    id IN (SELECT store_id FROM store_accounts WHERE id = auth.uid())
  )
  WITH CHECK (
    id IN (SELECT store_id FROM store_accounts WHERE id = auth.uid())
  );

-- flyers: 自店のみ管理
CREATE POLICY "Store owners manage own flyers"
  ON flyers FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (SELECT store_id FROM store_accounts WHERE id = auth.uid())
  );

CREATE POLICY "Store owners update own flyers"
  ON flyers FOR UPDATE
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM store_accounts WHERE id = auth.uid())
  )
  WITH CHECK (
    store_id IN (SELECT store_id FROM store_accounts WHERE id = auth.uid())
  );

CREATE POLICY "Store owners delete own flyers"
  ON flyers FOR DELETE
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM store_accounts WHERE id = auth.uid())
  );

-- Storage: 公開アップロードを廃止し自店フォルダのみ
DROP POLICY IF EXISTS "Public upload access for flyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Public update access for flyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for flyer-images" ON storage.objects;
DROP POLICY IF EXISTS "Image files only for flyer-images" ON storage.objects;

CREATE POLICY "Store owners upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'flyer-images'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM store_accounts WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store owners update own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'flyer-images'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM store_accounts WHERE id = auth.uid()
    )
  );

CREATE POLICY "Store owners delete own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'flyer-images'
    AND (storage.foldername(name))[1] = (
      SELECT store_id::text FROM store_accounts WHERE id = auth.uid()
    )
  );
