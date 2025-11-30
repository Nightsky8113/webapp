/**
 * Overpass APIを使用してOpenStreetMapから近くのスーパーマーケットを検索するサービス
 * 完全無料のAPIを使用し、30分間のキャッシュ機能でAPI呼び出し回数を削減する
 */

let cache = {};
const CACHE_DURATION = 30 * 60 * 1000;

/**
 * 位置情報と検索半径から一意のキャッシュキーを生成する
 * 位置情報を100m単位で丸めることで、近い位置での検索結果を再利用し、キャッシュ効率を向上させる
 */
function getCacheKey(lat, lng, radius) {
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `overpass_${roundedLat}_${roundedLng}_${radius}`;
}

/**
 * Haversine公式を使用して2点間の距離をキロメートル単位で計算する
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = Math.PI / 180;
    const dLat = (lat2 - lat1) * R;
    const dLng = (lng2 - lng1) * R;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * R) * Math.cos(lat2 * R) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c; // 地球の半径 6371km
}

/**
 * 指定された位置と半径内のスーパーマーケットをOverpass APIで検索する
 * 検索結果をアプリケーションで使用する形式に変換し、距離順にソートして返す
 * キャッシュが有効な場合はAPI呼び出しをスキップしてキャッシュデータを返す
 */
export async function searchNearbyStores(lat, lng, radius = 2000) {
    const cacheKey = getCacheKey(lat, lng, radius);
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
        console.log('Overpass API: キャッシュから店舗データを取得');
        return cached.data;
    }

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
        console.log('Overpass API: 店舗を検索中...', { lat, lng, radius });
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (!data.elements || data.elements.length === 0) {
            console.log('Overpass API: 店舗が見つかりませんでした');
            return [];
        }

        const stores = [];
        data.elements.forEach(element => {
            const latitude = element.lat || (element.center && element.center.lat);
            const longitude = element.lon || (element.center && element.center.lon);

            if (!latitude || !longitude) return;

            const distance = calculateDistance(lat, lng, latitude, longitude);

            stores.push({
                id: `overpass_${element.id}`,
                name: element.tags?.name || '名前なしスーパー',
                latitude: latitude,
                longitude: longitude,
                address: element.tags?.['addr:full'] || 
                         element.tags?.['addr:street'] || 
                         element.tags?.['addr:city'] || '',
                distance: distance,
                is_from_api: true,
                api_provider: 'overpass',
                has_flyer: false
            });
        });

        stores.sort((a, b) => a.distance - b.distance);

        console.log(`Overpass API: ${stores.length}件の店舗を取得しました`);

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

/**
 * 保存されているすべてのキャッシュデータをクリアする
 * 新しいデータを強制的に取得したい場合に使用する
 */
export function clearCache() {
    cache = {};
}

