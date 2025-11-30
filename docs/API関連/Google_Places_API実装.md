# 近くのスーパーマーケット検出機能の実装方法

## 📋 実装概要

ユーザーの現在地付近のスーパーマーケットを自動検出し、地図上にピンを立てたり、店舗一覧に表示する機能を実装します。

---

## 🎯 実装方法

### 方法1: Google Places API (Nearby Search) ⭐️ **推奨**

#### メリット
- ✅ 高い精度で店舗情報を取得
- ✅ 日本語対応
- ✅ 店舗名、住所、営業時間などの詳細情報が取得できる
- ✅ 評価やレビュー情報も取得可能

#### デメリット
- ⚠️ **コストがかかる**（無料枠を超えると料金が発生）

#### Google Places APIの料金（2025年時点）
- **無料枠**: 毎月$200相当のクレジット
- **Nearby Search**: 
  - テキスト検索: $32/1,000リクエスト
  - Nearby Search: $32/1,000リクエスト
- **推奨**: 無料枠内であれば、約6,250リクエスト/月まで無料

#### 実装内容

1. **Google Places API キーの取得**
   - Google Cloud Consoleでプロジェクトを作成
   - Places APIを有効化
   - APIキーを取得

2. **新しいサービスファイルの作成**
   - `src/services/placesApi.js` - Google Places APIとの通信

3. **既存ページの拡張**
   - `StoresPage.js` - データベースの店舗 + API検索結果を統合
   - `src/utils/map.js` - 検索結果の店舗もマーカー表示

4. **機能追加**
   - 「近くのスーパーを検索」ボタン
   - 検索結果をデータベースの店舗と統合表示
   - 検索結果のみ表示するオプション

---

### 方法2: OpenStreetMap Overpass API（完全無料）

#### メリット
- ✅ **完全無料**（コスト0円）
- ✅ データが豊富

#### デメリット
- ⚠️ 実装が複雑
- ⚠️ 日本語対応が限定的
- ⚠️ 店舗の詳細情報が少ない

#### 実装内容

1. **Overpass APIを使用したクエリ**
   - ユーザーの現在地から半径Xkm以内のスーパーマーケットを検索
   - ノード情報から店舗情報を抽出

2. **データの整形**
   - OSMデータをアプリの形式に変換

---

## 💡 推奨実装プラン

### Phase 1: Google Places APIの実装（推奨）

1. **環境変数の追加**
   ```env
   VITE_GOOGLE_PLACES_API_KEY=your-api-key-here
   ```

2. **Places APIサービスの作成**
   - `src/services/placesApi.js`を作成

3. **UIの追加**
   - StoresPageに「近くのスーパーを検索」ボタンを追加
   - 検索結果を統合表示

4. **コスト管理**
   - リクエスト数を制限
   - キャッシュ機能を実装

---

## 📝 実装例（Google Places API）

### 1. `src/services/placesApi.js` の作成

```javascript
/**
 * Google Places API サービス
 * 近くのスーパーマーケットを検索
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const CACHE_DURATION = 30 * 60 * 1000; // 30分キャッシュ
let nearbyStoresCache = null;
let cacheTime = null;

/**
 * 近くのスーパーマーケットを検索
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @param {number} radius - 検索半径（メートル）
 * @returns {Promise<Array>} 店舗情報の配列
 */
export async function searchNearbySupermarkets(lat, lng, radius = 2000) {
    // キャッシュチェック
    if (nearbyStoresCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
        return nearbyStoresCache;
    }

    if (!API_KEY) {
        console.warn('Google Places APIキーが設定されていません');
        return [];
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=supermarket&language=ja&key=${API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Places API エラー:', data.status);
            return [];
        }

        // アプリの形式に変換
        const stores = data.results.map(place => ({
            id: `places_${place.place_id}`, // データベースの店舗と区別
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.vicinity,
            rating: place.rating || null,
            user_ratings_total: place.user_ratings_total || 0,
            is_from_api: true, // APIから取得した店舗であることを示す
            place_id: place.place_id
        }));

        // キャッシュに保存
        nearbyStoresCache = stores;
        cacheTime = Date.now();

        return stores;
    } catch (error) {
        console.error('Places API 検索エラー:', error);
        return [];
    }
}

/**
 * キャッシュをクリア
 */
export function clearPlacesCache() {
    nearbyStoresCache = null;
    cacheTime = null;
}
```

### 2. `StoresPage.js` の拡張

```javascript
import { searchNearbySupermarkets } from '../services/placesApi.js';

// StoresPage関数内でAPI検索を統合
export async function StoresPage(userLocation) {
    const stores = await getStores();
    const flyers = await getFlyers();
    
    // 近くのスーパーを検索（オプション）
    let nearbySupermarkets = [];
    if (userLocation && userLocation.lat && userLocation.lng) {
        nearbySupermarkets = await searchNearbySupermarkets(
            userLocation.lat,
            userLocation.lng,
            2000 // 2km以内
        );
    }
    
    // データベースの店舗とAPI検索結果を統合
    const allStores = [
        ...stores,
        ...nearbySupermarkets.filter(apiStore => 
            !stores.some(dbStore => 
                Math.abs(dbStore.latitude - apiStore.latitude) < 0.001 &&
                Math.abs(dbStore.longitude - apiStore.longitude) < 0.001
            )
        )
    ];
    
    // 距離順にソート（最大6件）
    const storesWithDistance = sortByDistance(allStores, userLocation).slice(0, 6);
    
    // 以下、既存の処理...
}
```

---

## ⚠️ コストについて

### Google Places APIの料金（目安）

- **無料枠**: 毎月$200相当のクレジット
- **Nearby Search**: $32/1,000リクエスト

**例**:
- 1ユーザーが1回検索 = 1リクエスト
- 100ユーザー/日 × 30日 = 3,000リクエスト/月
- コスト: **$0**（無料枠内）

**無料枠を超える場合**:
- 6,250リクエスト/月以上使用すると課金開始
- 7,000リクエスト/月 = 約$24（750リクエスト × $0.032）

### コスト削減の対策

1. **キャッシュ機能** - 30分間キャッシュ（既に実装例に含む）
2. **リクエスト制限** - 1ユーザーあたり1日N回まで
3. **オプション機能** - デフォルトはOFF、ユーザーがON/OFFを選択

---

## 🎯 実装の優先順位

### 推奨: 段階的な実装

1. **Phase 1**: Google Places APIを実装（オプション機能として）
   - 「近くのスーパーを検索」ボタンを追加
   - デフォルトはデータベースの店舗のみ表示
   - ボタンをクリックしたときのみAPI検索を実行

2. **Phase 2**: コスト管理機能を追加
   - リクエスト数のモニタリング
   - キャッシュの最適化

3. **Phase 3**: UIの改善
   - データベースの店舗とAPI検索結果の区別表示
   - フィルタリング機能

---

## 📚 参考資料

- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Places API 料金](https://developers.google.com/maps/billing-and-pricing/pricing#places)
- [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)

---

## ❓ 実装を進めますか？

1. **Google Places APIを使用** - 高品質だがコストがかかる
2. **OpenStreetMapを使用** - 完全無料だが実装が複雑
3. **後回しにする** - コストがかかる機能のため後で実装

どれで進めますか？

