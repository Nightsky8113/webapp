/**
 * Haversine公式を使用して2点間の距離を計算
 * @param {number} lat1 - 地点1の緯度
 * @param {number} lon1 - 地点1の経度
 * @param {number} lat2 - 地点2の緯度
 * @param {number} lon2 - 地点2の経度
 * @returns {number} 距離（km）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    // 地球の半径（km）
    const R = 6371;

    // ラジアンに変換
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
 * 度をラジアンに変換
 * @param {number} deg - 度
 * @returns {number} ラジアン
 */
function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * 距離でソート（昇順）
 * @param {Array} stores - 店舗の配列
 * @param {Object} userLocation - ユーザーの位置 {lat, lng}
 * @returns {Array} ソート済みの店舗配列
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
 * 指定した範囲内の店舗をフィルタリング
 * @param {Array} stores - 店舗の配列
 * @param {Object} userLocation - ユーザーの位置 {lat, lng}
 * @param {number} maxDistance - 最大距離（km）
 * @returns {Array} フィルタリング済みの店舗配列
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