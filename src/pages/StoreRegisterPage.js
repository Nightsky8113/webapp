import { searchNearbyStores } from '../services/storeSearchService.js';
import { registerStoreAccount, getRegisteredStoreByOsm } from '../services/storeAuthService.js';
import { escapeHtml } from '../utils/helpers.js';
import { getDefaultLocation, requestUserLocation } from '../utils/location.js';
import { TIMEOUT_SHORT } from '../utils/constants.js';

let selectedOsmStore = null;
let searchResults = [];

/**
 * 店舗登録ページ（OSM発見 → 地図で確認 → ログインID発行）
 */
export async function StoreRegisterPage() {
    selectedOsmStore = null;
    searchResults = [];

    return `
    <div class="store-portal-page space-y-6">
      <div class="flex items-center gap-4">
        <button type="button" id="back-button" class="btn-back"><span class="text-lg">←</span><span>戻る</span></button>
        <h1 class="page-title">店舗アカウント登録</h1>
      </div>

      <div id="register-flow">
        <div class="info-box blue">
          <p>OpenStreetMapで自店を選ぶと、<strong>6桁の店舗ログインID</strong>と<strong>初期パスワード</strong>が自動で発行されます。地図または一覧から自店を選択してください。</p>
        </div>

        <section class="upload-form-card space-y-4">
          <h2 class="text-xl font-bold text-gray-800">1. 近くのスーパーを検索</h2>
          <button type="button" id="search-osm-btn" class="btn-primary">現在地付近を検索</button>
          <p id="search-status" class="text-sm text-gray-500"></p>
          <div id="register-map" class="map-container hidden"></div>
          <div id="osm-results" class="space-y-2"></div>
        </section>

        <section id="confirm-section" class="upload-form-card space-y-4 hidden">
          <h2 class="text-xl font-bold text-gray-800">2. 店舗情報の確認</h2>
          <div class="form-group">
            <label for="store-name-input" class="form-label">店舗名</label>
            <input type="text" id="store-name-input" class="form-input w-full" required />
          </div>
          <div class="form-group">
            <label for="store-address-input" class="form-label">住所</label>
            <input type="text" id="store-address-input" class="form-input w-full" />
          </div>
          <div id="register-status" class="upload-status hidden"></div>
          <button type="button" id="register-submit" class="btn-primary w-full">登録する（ログインIDを発行）</button>
        </section>

        <p class="text-center text-sm text-gray-500">
          既にログインIDをお持ちの方は
          <a href="#/store/login" class="text-blue-600 hover:underline">ログイン</a>
        </p>
      </div>

      <section id="credentials-section" class="upload-form-card space-y-4 hidden">
        <h2 class="text-xl font-bold text-green-700">登録完了</h2>
        <p class="text-gray-700">以下を必ず控えてください。再表示できません。</p>
        <div class="p-4 bg-gray-100 rounded-lg space-y-3 font-mono text-lg">
          <div>
            <span class="text-sm text-gray-600 block">店舗ログインID</span>
            <strong id="issued-login-id">—</strong>
          </div>
          <div>
            <span class="text-sm text-gray-600 block">初期パスワード</span>
            <strong id="issued-password">—</strong>
          </div>
          <div class="text-sm text-gray-600 font-sans">
            店舗管理番号（内部）: <span id="issued-store-id">—</span>
          </div>
        </div>
        <button type="button" id="go-upload-btn" class="btn-primary w-full">チラシアップロードへ</button>
      </section>
    </div>
  `;
}

export async function attachStoreRegisterPageEvents() {
    document.getElementById('back-button')?.addEventListener('click', () => {
        window.location.hash = '/home';
    });

    document.getElementById('go-upload-btn')?.addEventListener('click', () => {
        window.location.hash = '/store/upload';
    });

    document.getElementById('search-osm-btn')?.addEventListener('click', async () => {
        const statusEl = document.getElementById('search-status');
        const resultsEl = document.getElementById('osm-results');
        const mapEl = document.getElementById('register-map');
        if (!statusEl || !resultsEl) return;

        statusEl.textContent = '検索中...';
        resultsEl.innerHTML = '';
        mapEl?.classList.add('hidden');

        let loc;
        try {
            loc = await requestUserLocation();
        } catch {
            loc = getDefaultLocation();
            statusEl.textContent = '位置情報を取得できなかったため、デフォルト位置で検索します。';
        }

        try {
            searchResults = await searchNearbyStores(loc.lat, loc.lng, 3000);
            if (searchResults.length === 0) {
                statusEl.textContent = '近くにスーパーが見つかりませんでした。';
                return;
            }

            statusEl.textContent = `${searchResults.length}件見つかりました。地図または一覧から自店を選択してください。`;

            const claimedFlags = await Promise.all(
                searchResults.map((store) => getRegisteredStoreByOsm(store.osm_type, store.osm_id))
            );

            const itemsHtml = searchResults.map((store, index) => {
                const claimed = claimedFlags[index];
                const disabled = claimed ? 'disabled' : '';
                const badge = claimed
                    ? '<span class="text-xs text-red-600">登録済み</span>'
                    : `<span class="text-xs text-gray-500">${store.distance.toFixed(1)} km</span>`;

                return `
                  <button type="button" class="osm-pick-btn w-full text-left p-4 border rounded-lg hover:bg-blue-50 ${disabled}"
                    data-osm-type="${escapeHtml(store.osm_type)}"
                    data-osm-id="${store.osm_id}"
                    ${disabled}>
                    <div class="font-semibold">${escapeHtml(store.name)}</div>
                    <div class="text-sm text-gray-600">${escapeHtml(store.address || '住所不明')}</div>
                    ${badge}
                  </button>
                `;
            });

            resultsEl.innerHTML = itemsHtml.join('');

            resultsEl.querySelectorAll('.osm-pick-btn:not([disabled])').forEach((btn) => {
                btn.addEventListener('click', () => selectOsmStore(btn));
            });

            setTimeout(() => {
                renderRegisterMap(loc, claimedFlags);
            }, TIMEOUT_SHORT);
        } catch (err) {
            console.error(err);
            statusEl.textContent = '検索に失敗しました。';
        }
    });

    document.getElementById('register-submit')?.addEventListener('click', async () => {
        if (!selectedOsmStore) {
            showRegisterStatus('店舗を選択してください。', 'error');
            return;
        }

        const name = document.getElementById('store-name-input')?.value?.trim();
        const address = document.getElementById('store-address-input')?.value?.trim();

        if (!name) {
            showRegisterStatus('店舗名を入力してください。', 'error');
            return;
        }

        const submitBtn = document.getElementById('register-submit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '登録中...';
        }
        showRegisterStatus('登録処理中...', 'loading');

        const result = await registerStoreAccount({
            storePayload: {
                osm_type: selectedOsmStore.osm_type,
                osm_id: selectedOsmStore.osm_id,
                name,
                latitude: selectedOsmStore.latitude,
                longitude: selectedOsmStore.longitude,
                address
            }
        });

        if (result.success) {
            showIssuedCredentials(result.loginId, result.password, result.storeId);
        } else {
            showRegisterStatus(result.error || '登録に失敗しました。', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '登録する（ログインIDを発行）';
            }
        }
    });
}

async function renderRegisterMap(userLocation, claimedFlags) {
    const mapEl = document.getElementById('register-map');
    if (!mapEl || !userLocation) return;

    mapEl.classList.remove('hidden');

    const { initMap, addStoreMarker, clearMarkers, fitBounds } = await import('../utils/map.js');

    initMap('register-map', userLocation.lat, userLocation.lng);
    clearMarkers();

    searchResults.forEach((store, index) => {
        if (claimedFlags[index]) return;

        const name = escapeHtml(store.name);
        const distance = `${store.distance.toFixed(1)} km`;
        const osmType = escapeHtml(store.osm_type);
        const osmId = store.osm_id;

        const popupContent = `
            <b>${name}</b><br>
            📍 ${distance}<br>
            <button type="button" class="pick-osm-map-btn mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              data-osm-type="${osmType}" data-osm-id="${osmId}">
              この店舗を選択
            </button>
        `;

        addStoreMarker(store.latitude, store.longitude, store.name, popupContent, {
            onPopupOpen: (popupEl) => {
                const pickBtn = popupEl?.querySelector('.pick-osm-map-btn');
                if (pickBtn) {
                    pickBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        selectOsmStoreByIds(pickBtn.dataset.osmType, parseInt(pickBtn.dataset.osmId, 10));
                    });
                }
            }
        });
    });

    fitBounds(userLocation);
}

function selectOsmStore(btn) {
    selectOsmStoreByIds(btn.dataset.osmType, parseInt(btn.dataset.osmId, 10), btn);
}

function selectOsmStoreByIds(osmType, osmId, listBtn = null) {
    selectedOsmStore = searchResults.find(
        (s) => s.osm_type === osmType && s.osm_id === osmId
    );
    if (!selectedOsmStore) return;

    document.getElementById('confirm-section')?.classList.remove('hidden');

    const nameInput = document.getElementById('store-name-input');
    const addressInput = document.getElementById('store-address-input');
    if (nameInput) nameInput.value = selectedOsmStore.name;
    if (addressInput) addressInput.value = selectedOsmStore.address || '';

    document.querySelectorAll('.osm-pick-btn').forEach((b) => {
        b.classList.remove('ring-2', 'ring-blue-500');
    });

    const targetBtn = listBtn || document.querySelector(
        `.osm-pick-btn[data-osm-type="${osmType}"][data-osm-id="${osmId}"]`
    );
    targetBtn?.classList.add('ring-2', 'ring-blue-500');

    import('../utils/map.js').then(({ focusMapOn }) => {
        focusMapOn(selectedOsmStore.latitude, selectedOsmStore.longitude, 17);
    });
}

function showIssuedCredentials(loginId, password, storeId) {
    document.getElementById('register-flow')?.classList.add('hidden');
    document.getElementById('credentials-section')?.classList.remove('hidden');

    const loginEl = document.getElementById('issued-login-id');
    const passEl = document.getElementById('issued-password');
    const storeEl = document.getElementById('issued-store-id');
    if (loginEl) loginEl.textContent = String(loginId);
    if (passEl) passEl.textContent = password;
    if (storeEl) storeEl.textContent = String(storeId);
}

function showRegisterStatus(message, type) {
    const el = document.getElementById('register-status');
    if (!el) return;
    el.textContent = message;
    el.className = `upload-status ${type}`;
    el.classList.remove('hidden');
}
