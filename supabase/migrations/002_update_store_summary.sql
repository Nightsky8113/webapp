-- 店舗データの集計処理（最安価商品の自動計算）
-- 商品データが更新されたときに、自動で店舗のsummary_best_itemを更新

-- 1. 店舗ごとの最安価商品を計算する関数
CREATE OR REPLACE FUNCTION calculate_store_best_item(p_store_id INTEGER)
RETURNS TABLE (
  best_item_id INTEGER,
  best_item_name TEXT,
  best_item_price INTEGER
) AS $$
DECLARE
  latest_flyer_id INTEGER;
BEGIN
  -- 最新のチラシIDを取得
  SELECT id INTO latest_flyer_id
  FROM flyers
  WHERE store_id = p_store_id
    AND is_latest = TRUE
  LIMIT 1;

  -- チラシが存在しない場合はNULLを返す
  IF latest_flyer_id IS NULL THEN
    RETURN;
  END IF;

  -- 最安価商品を取得（価格が同じ場合はIDが小さいものを優先）
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    i.price
  FROM items i
  WHERE i.flyer_id = latest_flyer_id
  ORDER BY i.price ASC, i.id ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 2. 店舗のsummary_best_itemを更新する関数
CREATE OR REPLACE FUNCTION update_store_summary(p_store_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_best_item RECORD;
  latest_flyer_id INTEGER;
BEGIN
  -- 最新のチラシIDを取得
  SELECT id INTO latest_flyer_id
  FROM flyers
  WHERE store_id = p_store_id
    AND is_latest = TRUE
  LIMIT 1;

  -- チラシが存在しない場合はsummaryをNULLに設定
  IF latest_flyer_id IS NULL THEN
    UPDATE stores
    SET 
      summary_best_item_id = NULL,
      summary_best_item_name = NULL,
      summary_best_item_price = NULL,
      updated_at = NOW()
    WHERE id = p_store_id;
    RETURN;
  END IF;

  -- 最安価商品を取得
  SELECT * INTO v_best_item
  FROM calculate_store_best_item(p_store_id);

  -- 商品が存在しない場合はsummaryをNULLに設定
  IF v_best_item IS NULL THEN
    UPDATE stores
    SET 
      summary_best_item_id = NULL,
      summary_best_item_name = NULL,
      summary_best_item_price = NULL,
      updated_at = NOW()
    WHERE id = p_store_id;
    RETURN;
  END IF;

  -- 店舗のsummary_best_itemを更新
  UPDATE stores
  SET 
    summary_best_item_id = v_best_item.best_item_id,
    summary_best_item_name = v_best_item.best_item_name,
    summary_best_item_price = v_best_item.best_item_price,
    updated_at = NOW()
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql;

-- 3. 商品が追加・更新・削除されたときに店舗のsummaryを更新するトリガー関数
CREATE OR REPLACE FUNCTION trigger_update_store_summary_on_item_change()
RETURNS TRIGGER AS $$
DECLARE
  affected_store_id INTEGER;
  affected_flyer_id INTEGER;
BEGIN
  -- 影響を受けるチラシIDを取得
  IF TG_OP = 'DELETE' THEN
    affected_flyer_id := OLD.flyer_id;
  ELSE
    affected_flyer_id := NEW.flyer_id;
  END IF;

  -- チラシから店舗IDを取得
  SELECT store_id INTO affected_store_id
  FROM flyers
  WHERE id = affected_flyer_id;

  -- 店舗が存在する場合、summaryを更新
  IF affected_store_id IS NOT NULL THEN
    PERFORM update_store_summary(affected_store_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. 商品テーブルにトリガーを設定
CREATE TRIGGER trigger_items_update_store_summary
  AFTER INSERT OR UPDATE OR DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_store_summary_on_item_change();

-- 5. チラシのis_latestが変更されたときに店舗のsummaryを更新するトリガー関数
CREATE OR REPLACE FUNCTION trigger_update_store_summary_on_flyer_change()
RETURNS TRIGGER AS $$
BEGIN
  -- is_latestが変更された場合、またはチラシが追加された場合
  IF TG_OP = 'UPDATE' AND (OLD.is_latest IS DISTINCT FROM NEW.is_latest) THEN
    -- 古いチラシと新しいチラシの両方の店舗を更新
    PERFORM update_store_summary(OLD.store_id);
    IF OLD.store_id IS DISTINCT FROM NEW.store_id THEN
      PERFORM update_store_summary(NEW.store_id);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- 新しいチラシが追加された場合
    PERFORM update_store_summary(NEW.store_id);
  ELSIF TG_OP = 'DELETE' THEN
    -- チラシが削除された場合
    PERFORM update_store_summary(OLD.store_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. チラシテーブルにトリガーを設定
CREATE TRIGGER trigger_flyers_update_store_summary
  AFTER INSERT OR UPDATE OR DELETE ON flyers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_store_summary_on_flyer_change();

-- 7. 既存データに対して集計処理を実行（初期データの集計）
-- すべての店舗に対してsummaryを更新
DO $$
DECLARE
  store_rec RECORD;
BEGIN
  FOR store_rec IN SELECT id FROM stores LOOP
    PERFORM update_store_summary(store_rec.id);
  END LOOP;
END $$;





