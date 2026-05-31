/**
 * アプリケーション全体で使用する定数を定義
 * マジックナンバーを削減し、保守性を向上させる
 */

// 店舗検索関連
export const STORE_SEARCH_RADIUS = 2000; // 検索半径（メートル、デフォルト2km）
export const STORE_DUPLICATE_THRESHOLD = 0.001; // 重複判定（約100m）

// タイムアウト・待機時間（ミリ秒）
export const TIMEOUT_SHORT = 100; // 短い待機時間
export const TIMEOUT_MEDIUM = 200; // 中程度の待機時間
export const TIMEOUT_LONG = 300; // 長い待機時間
export const TIMEOUT_VERY_LONG = 500; // 非常に長い待機時間
export const DB_REFLECTION_DELAY = 100; // データベース反映待ち時間

// リトライ関連
export const MAX_RETRIES = 50; // 最大リトライ回数
export const RETRY_DELAY = 100; // リトライ間隔（ミリ秒）

// 地図関連
export const MAP_HEIGHT = 384; // 地図の高さ（px、h-96 = 384px）
export const MAP_ZOOM_DEFAULT = 15; // デフォルトのズームレベル
export const MAP_ZOOM_MAX = 19; // 最大ズームレベル
export const MAP_BOUNDS_PADDING = 50; // 地図の境界線パディング

// 最大表示件数
export const MAX_STORES_DISPLAY = 6; // 店舗検索ページで表示する最大店舗数
export const MAX_WALKING_TIME_TIMEOUT = 2000; // 徒歩時間取得のタイムアウト（ミリ秒）



