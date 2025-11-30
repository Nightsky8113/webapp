# API切り替え戦略：Overpass API → Google Places API

## 📋 概要

まずOverpass API（無料）で実装し、後でGoogle Places APIに切り替えられる設計を提案します。

---

## 🎯 設計方針

### アーキテクチャ

```
┌─────────────────┐
│   Pages/UI      │
└────────┬────────┘
         │
┌────────▼────────┐
│  抽象化レイヤー   │  ← 共通インターフェース
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────────┐
│Overpass│ │Places API │
│  API   │ │  (将来)   │
└────────┘ └───────────┘
```

### メリット

- ✅ **段階的な実装** - まず無料で実装してテスト
- ✅ **簡単な切り替え** - 設定を変更するだけ
- ✅ **両方のAPIを併用可能** - フォールバック機能として
- ✅ **コスト管理** - 必要になったときだけPlaces APIを使用

---

## 🔧 実装方法

### Step 1: 抽象化インターフェースの定義

`src/services/storeSearchService.js`を作成

```javascript
/**
 * 店舗検索サービスの抽象化レイヤー
 * APIプロバイダーを切り替え可能にする
 */

// 設定：どちらのAPIを使用するか
const API_PROVIDER = import.meta.env.VITE_STORE_SEARCH_API || 'overpass'; // 'overpass' | 'places'

/**
 * 店舗検索の共通インターフェース
 * @param {number} lat - 緯度
 * @param {number} lng - 経度
 * @param {number} radius - 検索半径（メートル）
 * @returns {Promise<Array>} 店舗情報の配列
 */
export async function searchNearbyStores(lat, lng, radius = 2000) {
    switch (API_PROVIDER) {
        case 'places':
            return await searchWithPlacesAPI(lat, lng, radius);
        case 'overpass':
        default:
            return await searchWithOverpassAPI(lat, lng, radius);
    }
}

/**
 * 両方のAPIから検索して統合（オプション）
 */
export async function searchWithBothAPIs(lat, lng, radius = 2000) {
    const [overpassStores, placesStores] = await Promise.allSettled([
        searchWithOverpassAPI(lat, lng, radius),
        searchWithPlacesAPI(lat, lng, radius)
    ]);

    const stores = [];
    
    // Overpass APIの結果を追加
    if (overpassStores.status === 'fulfilled') {
        stores.push(...overpassStores.value);
    }

    // Places APIの結果を追加（重複排除）
    if (placesStores.status === 'fulfilled') {
        placesStores.value.forEach(placeStore => {
            const isDuplicate = stores.some(s => 
                Math.abs(s.latitude - placeStore.latitude) < 0.001 &&
                Math.abs(s.longitude - placeStore.longitude) < 0.001
            );
            if (!isDuplicate) {
                stores.push(placeStore);
            }
        });
    }

    return stores;
}
```

---

### Step 2: Overpass API実装（最初に実装）

`src/services/overpassApi.js`を作成

```javascript
/**
 * Overpass APIを使用して店舗を検索
 */

// キャッシュ
let cache = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30分

/**
 * 位置情報をキーとしてキャッシュキーを生成
 */
function getCacheKey(lat, lng, radius) {
    // 位置情報を丸めてキャッシュ効率を向上（±100m以内は同じキー）
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `overpass_${roundedLat}_${roundedLng}_${radius}`;
}

/**
 * Overpass APIで店舗を検索
 */
export async function searchNearbyStores(lat, lng, radius = 2000) {
    // キャッシュチェック
    const cacheKey = getCacheKey(lat, lng, radius);
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
        return cached.data;
    }

    // Overpass APIクエリ
    const query = `
        [out:json][timeout:25];
        (
            node["shop"="supermarket"](around:${radius},${lat},${lng});
            way["shop"="supermarket"](around:${radius},${lat},${lng});
            relation["shop"="supermarket"](around:${radius},${lat},${lng});
        );
        out center;
    `;

    try {
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        const data = await response.json();

        // アプリの形式に変換
        const stores = data.elements.map(element => ({
            id: `overpass_${element.id}`,
            name: element.tags?.name || '名前なしスーパー',
            latitude: element.lat || element.center?.lat,
            longitude: element.lon || element.center?.lon,
            address: element.tags?.['addr:full'] || element.tags?.['addr:street'] || '',
            is_from_api: true,
            api_provider: 'overpass'
        })).filter(store => store.latitude && store.longitude);

        // キャッシュに保存
        cache[cacheKey] = {
            data: stores,
            time: Date.now()
        };

        return stores;
    } catch (error) {
        console.error('Overpass API エラー:', error);
        return [];
    }
}
```

---

### Step 3: Google Places API実装（後で追加）

`src/services/placesApi.js`を作成

```javascript
/**
 * Google Places APIを使用して店舗を検索
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// キャッシュ
let cache = {};
const CACHE_DURATION = 30 * 60 * 1000; // 30分

/**
 * 位置情報をキーとしてキャッシュキーを生成
 */
function getCacheKey(lat, lng, radius) {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `places_${roundedLat}_${roundedLng}_${radius}`;
}

/**
 * Google Places APIで店舗を検索
 */
export async function searchNearbyStores(lat, lng, radius = 2000) {
    if (!API_KEY) {
        console.warn('Google Places APIキーが設定されていません');
        return [];
    }

    // キャッシュチェック
    const cacheKey = getCacheKey(lat, lng, radius);
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
        return cached.data;
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
            id: `places_${place.place_id}`,
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.vicinity,
            rating: place.rating || null,
            user_ratings_total: place.user_ratings_total || 0,
            is_from_api: true,
            api_provider: 'places',
            place_id: place.place_id
        }));

        // キャッシュに保存
        cache[cacheKey] = {
            data: stores,
            time: Date.now()
        };

        return stores;
    } catch (error) {
        console.error('Places API 検索エラー:', error);
        return [];
    }
}
```

---

### Step 4: サービス層の統合

`src/services/storeSearchService.js`の完成版

```javascript
import { searchNearbyStores as searchWithOverpassAPI } from './overpassApi.js';
import { searchNearbyStores as searchWithPlacesAPI } from './placesApi.js';

// 設定：どちらのAPIを使用するか
const API_PROVIDER = import.meta.env.VITE_STORE_SEARCH_API || 'overpass';

/**
 * 店舗を検索（抽象化されたインターフェース）
 */
export async function searchNearbyStores(lat, lng, radius = 2000) {
    switch (API_PROVIDER) {
        case 'places':
            return await searchWithPlacesAPI(lat, lng, radius);
        case 'overpass':
        default:
            return await searchWithOverpassAPI(lat, lng, radius);
    }
}

/**
 * 両方のAPIから検索して統合
 */
export async function searchWithBothAPIs(lat, lng, radius = 2000) {
    const results = await Promise.allSettled([
        searchWithOverpassAPI(lat, lng, radius),
        searchWithPlacesAPI(lat, lng, radius)
    ]);

    const stores = [];
    const processedIds = new Set();

    // Overpass APIの結果を追加
    if (results[0].status === 'fulfilled') {
        results[0].value.forEach(store => {
            stores.push(store);
            processedIds.add(`${store.latitude}_${store.longitude}`);
        });
    }

    // Places APIの結果を追加（重複排除）
    if (results[1].status === 'fulfilled') {
        results[1].value.forEach(store => {
            const key = `${store.latitude}_${store.longitude}`;
            if (!processedIds.has(key)) {
                stores.push(store);
                processedIds.add(key);
            }
        });
    }

    return stores;
}
```

---

### Step 5: ページでの使用

`src/pages/StoresPage.js`の修正

```javascript
import { searchNearbyStores } from '../services/storeSearchService.js';

export async function StoresPage(userLocation) {
    const stores = await getStores(); // データベースの店舗
    const flyers = await getFlyers();

    // APIから近くのスーパーを検索
    let apiStores = [];
    if (userLocation && userLocation.lat && userLocation.lng) {
        apiStores = await searchNearbyStores(
            userLocation.lat,
            userLocation.lng,
            2000 // 2km以内
        );
    }

    // データベースの店舗とAPI検索結果を統合
    const allStores = [
        ...stores,
        ...apiStores.filter(apiStore => 
            !stores.some(dbStore => 
                Math.abs(dbStore.latitude - apiStore.latitude) < 0.001 &&
                Math.abs(dbStore.longitude - apiStore.longitude) < 0.001
            )
        )
    ];

    // 距離順にソート（最大6件）
    const storesWithDistance = sortByDistance(allStores, userLocation).slice(0, 6);
    // ...
}
```

---

## 🔄 API切り替え方法

### 方法1: 環境変数で切り替え（推奨）

`.env`ファイルに設定を追加：

```env
# Overpass APIを使用（デフォルト）
VITE_STORE_SEARCH_API=overpass

# または Google Places APIを使用
# VITE_STORE_SEARCH_API=places
# VITE_GOOGLE_PLACES_API_KEY=your-api-key-here
```

### 方法2: 設定ファイルで切り替え

`src/config/api.config.js`を作成：

```javascript
export const API_CONFIG = {
    storeSearch: {
        provider: 'overpass', // 'overpass' | 'places' | 'both'
        overpass: {
            enabled: true
        },
        places: {
            enabled: false,
            apiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY
        }
    }
};
```

---

## 📊 両方のAPIを併用する方法

### フォールバック機能

```javascript
export async function searchNearbyStoresWithFallback(lat, lng, radius = 2000) {
    // まずPlaces APIを試す（高品質）
    try {
        const placesStores = await searchWithPlacesAPI(lat, lng, radius);
        if (placesStores.length > 0) {
            return placesStores;
        }
    } catch (error) {
        console.warn('Places API失敗、Overpass APIにフォールバック:', error);
    }

    // Places APIが失敗したらOverpass APIを使用（無料）
    return await searchWithOverpassAPI(lat, lng, radius);
}
```

### 両方の結果を統合

```javascript
// 両方のAPIから検索して結果を統合
const stores = await searchWithBothAPIs(lat, lng, radius);

// データベースの店舗も追加
const allStores = [...dbStores, ...stores];
```

---

## 🎯 実装の順序

### Phase 1: Overpass APIで実装（最初）

1. ✅ `src/services/overpassApi.js`を作成
2. ✅ `src/services/storeSearchService.js`を作成（Overpass APIのみ）
3. ✅ `StoresPage.js`で使用
4. ✅ 動作確認

### Phase 2: Google Places APIを追加（後で）

1. ✅ `src/services/placesApi.js`を作成
2. ✅ `storeSearchService.js`を更新（両方のAPIに対応）
3. ✅ 環境変数で切り替え可能にする
4. ✅ 動作確認

### Phase 3: 切り替え・統合（オプション）

1. ✅ 設定でAPIプロバイダーを選択可能に
2. ✅ フォールバック機能を追加
3. ✅ 両方のAPIを併用する機能を追加

---

## ✅ 結論

**はい、可能です！**

1. **まずOverpass APIで実装** - 無料で動作確認
2. **後でGoogle Places APIに切り替え可能** - 環境変数を変更するだけ
3. **両方を併用も可能** - 結果を統合して表示

この設計により、段階的に実装・移行できます。

---

## 📝 次のステップ

1. **Overpass APIで実装を開始**する
2. **後でPlaces APIを追加**する準備だけしておく
3. **両方を実装**する

どれで進めますか？

