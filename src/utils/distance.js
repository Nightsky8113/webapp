/**
 * Haversine公式を使用して2点間の距離を計算するユーティリティ
 * 緯度・経度から地球表面上の実際の距離（キロメートル）を計算する
 */

/**
 * 2つの座標間の距離をHaversine公式で計算する
 * 地球を球体と仮定して、より正確な距離を算出する
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * 度数からラジアンに変換する補助関数
 */
function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * 店舗リストをユーザー位置からの距離順（近い順）にソートする
 * 各店舗オブジェクトにdistanceプロパティを追加して返す
 */
export function sortByDistance(stores, userLocation) {
    return stores
        .map(store => ({
            ...store,
            distance: calculateDistance(
                userLocation.lat,
                userLocation.lng,
                store.latitude,
                store.longitude
            )
        }))
        .sort((a, b) => a.distance - b.distance);
}

/**
 * 指定した距離範囲内の店舗のみをフィルタリングして返す
 * ユーザー位置から最大距離以内の店舗のみを抽出する
 */
export function filterByDistance(stores, userLocation, maxDistance = 5) {
    return stores.filter(store => {
        const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            store.latitude,
            store.longitude
        );
        return distance <= maxDistance;
    });
}