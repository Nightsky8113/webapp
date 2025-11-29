-- 初期データ投入

-- 1. ジャンル
INSERT INTO genres (id, name, icon) VALUES
(1, '精肉', '🥩'),
(2, '鮮魚', '🐟'),
(3, '野菜', '🥬'),
(4, '果物', '🍎'),
(5, '日用品', '🧴'),
(6, 'お菓子', '🍪'),
(7, '飲料', '🥤'),
(8, '冷凍食品', '🧊');

-- 2. 店舗
INSERT INTO stores (id, name, latitude, longitude, address, nearest_station, nearest_station_lat, nearest_station_lng, summary_walk_minutes, summary_best_item_name, summary_best_item_price, summary_best_item_id) VALUES
(1, 'フレッシュマート渋谷店', 35.6812, 139.7671, '東京都渋谷区道玄坂1-1-1', '渋谷駅', 35.6580, 139.7016, 5, '国産牛ロース', 1980, 1),
(2, 'デイリーストア新宿店', 35.6895, 139.6917, '東京都新宿区西新宿2-2-2', '新宿駅', 35.6896, 139.7006, 3, '本マグロ刺身', 1500, 4),
(3, 'スーパーバリュー池袋店', 35.7295, 139.7109, '東京都豊島区東池袋3-3-3', '池袋駅', 35.7295, 139.7109, 2, '有機野菜セット', 980, 7),
(4, 'マルシェ恵比寿店', 35.6467, 139.7100, '東京都渋谷区恵比寿南4-4-4', '恵比寿駅', 35.6467, 139.7100, 7, 'プレミアムいちご', 680, 10),
(5, 'グリーンマーケット世田谷店', 35.6462, 139.6503, '東京都世田谷区三軒茶屋5-5-5', '三軒茶屋駅', 35.6436, 139.6694, 8, '北海道産じゃがいも', 380, 13),
(6, 'フードプラザ目黒店', 35.6339, 139.7157, '東京都目黒区上目黒6-6-6', '中目黒駅', 35.6416, 139.6993, 6, 'ポテトチップス大袋', 198, 16);

-- 3. チラシ
INSERT INTO flyers (id, store_id, image_url, thumbnail_url, updated_at, ocr_done, is_latest) VALUES
(1, 1, 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400', '2025-11-29', false, true),
(2, 2, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400', '2025-11-29', false, true),
(3, 3, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', '2025-11-28', false, true),
(4, 4, 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800', 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=400', '2025-11-29', false, true),
(5, 5, 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800', 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400', '2025-11-27', false, true),
(6, 6, 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=800', 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=400', '2025-11-29', false, true);

-- 4. 商品
INSERT INTO items (id, flyer_id, name, genre_id, price, confidence, bbox_x, bbox_y, bbox_width, bbox_height) VALUES
(1, 1, '国産牛ロース', 1, 1980, 0.95, 100, 200, 150, 100),
(2, 1, '豚バラ肉', 1, 580, 0.92, 300, 200, 150, 100),
(3, 1, '鶏もも肉', 1, 380, 0.88, 500, 200, 150, 100),
(4, 2, '本マグロ刺身', 2, 1500, 0.97, 100, 150, 180, 120),
(5, 2, '生サーモン', 2, 880, 0.93, 320, 150, 180, 120),
(6, 2, 'エビ特大', 2, 680, 0.90, 540, 150, 180, 120),
(7, 3, '有機野菜セット', 3, 980, 0.96, 150, 180, 160, 110),
(8, 3, 'トマト', 3, 280, 0.94, 350, 180, 160, 110),
(9, 3, 'きゅうり', 3, 180, 0.91, 550, 180, 160, 110),
(10, 4, 'プレミアムいちご', 4, 680, 0.98, 120, 160, 170, 115),
(11, 4, '国産りんご', 4, 480, 0.95, 330, 160, 170, 115),
(12, 4, 'バナナ', 4, 198, 0.89, 540, 160, 170, 115),
(13, 5, '北海道産じゃがいも', 3, 380, 0.92, 110, 190, 155, 105),
(14, 5, '玉ねぎ', 3, 280, 0.90, 310, 190, 155, 105),
(15, 5, 'にんじん', 3, 220, 0.87, 510, 190, 155, 105),
(16, 6, 'ポテトチップス大袋', 6, 198, 0.94, 130, 170, 165, 112),
(17, 6, 'チョコレート詰め合わせ', 6, 580, 0.93, 340, 170, 165, 112),
(18, 6, 'クッキーセット', 6, 398, 0.91, 550, 170, 165, 112);

-- シーケンスをリセット（次のINSERT時に正しいIDを使用）
SELECT setval('genres_id_seq', (SELECT MAX(id) FROM genres));
SELECT setval('stores_id_seq', (SELECT MAX(id) FROM stores));
SELECT setval('flyers_id_seq', (SELECT MAX(id) FROM flyers));
SELECT setval('items_id_seq', (SELECT MAX(id) FROM items));