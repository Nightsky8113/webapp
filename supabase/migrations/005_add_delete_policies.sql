-- storesテーブルにDELETE権限を追加
-- 管理者がstoresテーブル内の全データを削除できるようにするために必要

-- storesテーブルにDELETE権限を追加（匿名ユーザーでも店舗を削除可能）
CREATE POLICY "Public delete access" ON stores FOR DELETE USING (true);

-- flyersテーブルにDELETE権限を追加（必要に応じて）
CREATE POLICY "Public delete access" ON flyers FOR DELETE USING (true);

-- itemsテーブルにDELETE権限を追加（必要に応じて）
CREATE POLICY "Public delete access" ON items FOR DELETE USING (true);


