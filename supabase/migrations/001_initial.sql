-- チラシ検索アプリ - PostgreSQLスキーマ

-- 1. ジャンルテーブル
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 店舗テーブル
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  nearest_station TEXT,
  nearest_station_lat REAL,
  nearest_station_lng REAL,
  summary_walk_minutes INTEGER,
  summary_best_item_name TEXT,
  summary_best_item_price INTEGER,
  summary_best_item_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. チラシテーブル
CREATE TABLE flyers (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  image_url TEXT,
  thumbnail_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ocr_done BOOLEAN DEFAULT FALSE,
  is_latest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 商品テーブル
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  flyer_id INTEGER NOT NULL REFERENCES flyers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  price INTEGER NOT NULL,
  confidence REAL,
  bbox_x INTEGER,
  bbox_y INTEGER,
  bbox_width INTEGER,
  bbox_height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. お気に入りテーブル（Phase 3で使用）
CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID, -- 将来的に認証機能追加時に使用
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- 6. 検索履歴テーブル（Phase 3で使用）
CREATE TABLE search_history (
  id SERIAL PRIMARY KEY,
  user_id UUID, -- 将来的に認証機能追加時に使用
  query TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX idx_flyers_store_id ON flyers(store_id);
CREATE INDEX idx_flyers_is_latest ON flyers(is_latest);
CREATE INDEX idx_items_flyer_id ON items(flyer_id);
CREATE INDEX idx_items_genre_id ON items(genre_id);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_store_id ON favorites(store_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);

-- Row Level Security (RLS) 有効化
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み取り権限を付与（認証不要）
CREATE POLICY "Public read access" ON genres FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read access" ON flyers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON items FOR SELECT USING (true);

-- お気に入りと検索履歴は将来的に認証後のユーザーのみアクセス可能にする
CREATE POLICY "Public read access" ON favorites FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete access" ON favorites FOR DELETE USING (true);

CREATE POLICY "Public read access" ON search_history FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON search_history FOR INSERT WITH CHECK (true);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flyers_updated_at
  BEFORE UPDATE ON flyers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();