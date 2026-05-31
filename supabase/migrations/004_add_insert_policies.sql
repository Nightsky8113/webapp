-- 店舗とチラシのINSERT権限を追加
-- 位置情報から探した店舗をDBに自動追加する機能のために必要

-- storesテーブルにINSERT権限を追加（匿名ユーザーでも店舗を追加可能）
CREATE POLICY "Public insert access" ON stores FOR INSERT WITH CHECK (true);

-- flyersテーブルにINSERT権限を追加（匿名ユーザーでもチラシを追加可能）
CREATE POLICY "Public insert access" ON flyers FOR INSERT WITH CHECK (true);

-- itemsテーブルにINSERT権限を追加（OCR処理で商品情報を追加するために必要）
CREATE POLICY "Public insert access" ON items FOR INSERT WITH CHECK (true);

-- storesテーブルにUPDATE権限を追加（店舗情報の更新に必要）
CREATE POLICY "Public update access" ON stores FOR UPDATE USING (true) WITH CHECK (true);

-- flyersテーブルにUPDATE権限を追加（チラシ情報の更新に必要）
CREATE POLICY "Public update access" ON flyers FOR UPDATE USING (true) WITH CHECK (true);




