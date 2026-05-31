-- 店舗自前管理: OSM連携カラムと店舗アカウント紐付け

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS osm_type TEXT,
  ADD COLUMN IF NOT EXISTS osm_id BIGINT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS stores_osm_unique
  ON stores (osm_type, osm_id)
  WHERE osm_id IS NOT NULL;

COMMENT ON COLUMN stores.osm_type IS 'OpenStreetMap要素種別: node, way, relation';
COMMENT ON COLUMN stores.osm_id IS 'OpenStreetMap要素ID';
COMMENT ON COLUMN stores.claimed_at IS '店舗アカウント登録日時';

-- 1店舗1アカウント
CREATE TABLE IF NOT EXISTS store_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id INTEGER NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_accounts_store_id ON store_accounts(store_id);

ALTER TABLE store_accounts ENABLE ROW LEVEL SECURITY;
