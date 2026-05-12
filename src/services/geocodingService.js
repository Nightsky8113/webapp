const NOMINATIM_BASE_URL = import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

/**
 * 緯度・経度から住所を取得する (Nominatim)
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>}
 */
export async function reverseGeocode(lat, lng) {
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
        return null;
    }

    try {
        const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('lat', String(lat));
        url.searchParams.set('lon', String(lng));
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('accept-language', 'ja');

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn('Nominatimリバースジオコーディング失敗:', response.status, response.statusText);
            return null;
        }

        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.warn('Nominatimリバースジオコーディングエラー:', error);
        return null;
    }
}
