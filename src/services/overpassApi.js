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
        return cached.data;
    }

    const query = `
        [out:json][timeout:25];
        (
            node["shop"="supermarket"](around:${radius},${lat},${lng});
            way["shop"="supermarket"](around:${radius},${lat},${lng});
            relation["shop"="supermarket"](around:${radius},${lat},${lng});
        );
        out center tags;
    `;

    try {
        const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (!data.elements || data.elements.length === 0) {
            return [];
        }

        const stores = [];
        data.elements.forEach(element => {
            const latitude = element.lat || (element.center && element.center.lat);
            const longitude = element.lon || (element.center && element.center.lon);

            if (!latitude || !longitude) return;

            const distance = calculateDistance(lat, lng, latitude, longitude);

            // 住所を組み立て（優先順位: addr:full > 組み立てた住所 > addr:street > addr:city）
            let address = '';
            if (element.tags?.['addr:full']) {
                // 完全な住所が存在する場合
                address = element.tags['addr:full'];
            } else {
                // 複数のタグを組み合わせて住所を構築
                const addressParts = [];
                if (element.tags?.['addr:postcode']) {
                    addressParts.push(`〒${element.tags['addr:postcode']}`);
                }
                if (element.tags?.['addr:prefecture']) {
                    addressParts.push(element.tags['addr:prefecture']);
                }
                if (element.tags?.['addr:city']) {
                    addressParts.push(element.tags['addr:city']);
                }
                if (element.tags?.['addr:suburb'] || element.tags?.['addr:neighbourhood']) {
                    addressParts.push(element.tags['addr:suburb'] || element.tags['addr:neighbourhood']);
                }
                if (element.tags?.['addr:quarter'] || element.tags?.['addr:block_number']) {
                    addressParts.push(element.tags['addr:quarter'] || element.tags['addr:block_number']);
                }
                if (element.tags?.['addr:street']) {
                    addressParts.push(element.tags['addr:street']);
                }
                if (element.tags?.['addr:housenumber']) {
                    addressParts.push(element.tags['addr:housenumber']);
                }
                if (element.tags?.['addr:housename']) {
                    addressParts.push(element.tags['addr:housename']);
                }
                
                if (addressParts.length > 0) {
                    address = addressParts.join(' ');
                } else {
                    // 組み立てられない場合は個別タグを試す
                    address = element.tags?.['addr:street'] || 
                             element.tags?.['addr:city'] || 
                             '';
                }
            }

            stores.push({
                id: `overpass_${element.id}`,
                name: element.tags?.name || '名前なしスーパー',
                latitude: latitude,
                longitude: longitude,
                address: address,
                distance: distance,
                is_from_api: true,
                api_provider: 'overpass',
                has_flyer: false
            });
        });

        stores.sort((a, b) => a.distance - b.distance);

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

