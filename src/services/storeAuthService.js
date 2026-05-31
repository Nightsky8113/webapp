/**
 * 店舗アカウント認証（数字ログインID + Supabase Auth）
 * メールは内部用のみ。店舗には login_id とパスワードを発行する。
 */

import { supabase, supabaseInitialized } from './supabase.js';

// Supabase Auth が受理する形式（.auth 等の独自TLDは invalid になる）
const AUTH_EMAIL_DOMAIN = import.meta.env.VITE_STORE_AUTH_EMAIL_DOMAIN || 'example.com';

/**
 * ログインIDから Supabase Auth 用の内部メールアドレスを生成する
 */
export function loginIdToAuthEmail(loginId) {
    const id = String(loginId).replace(/\D/g, '');
    return `store-${id}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * 6桁の店舗ログインIDを採番する（重複時は再試行）
 */
async function allocateLoginId() {
    for (let attempt = 0; attempt < 15; attempt++) {
        const loginId = Math.floor(100000 + Math.random() * 900000);
        const { data, error } = await supabase
            .from('store_accounts')
            .select('login_id')
            .eq('login_id', loginId)
            .maybeSingle();

        if (error) {
            console.error('login_id 確認エラー:', error);
            continue;
        }
        if (!data) {
            return loginId;
        }
    }
    throw new Error('店舗ログインIDの採番に失敗しました。しばらくしてから再試行してください。');
}

/**
 * 初期パスワードをランダム生成する（紛らわしい文字を除く）
 */
export function generateStorePassword(length = 10) {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        password += chars[randomValues[i] % chars.length];
    }
    return password;
}

/**
 * 現在のセッションを取得する
 */
export async function getSession() {
    if (!supabaseInitialized) {
        return null;
    }
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('セッション取得エラー:', error);
        return null;
    }
    return session;
}

/**
 * ログイン中の店舗アカウント情報（店舗データ含む）を取得する
 */
export async function getStoreAccount() {
    const session = await getSession();
    if (!session?.user) {
        return null;
    }

    const { data, error } = await supabase
        .from('store_accounts')
        .select('store_id, login_id, stores(*)')
        .eq('id', session.user.id)
        .maybeSingle();

    if (error) {
        console.error('店舗アカウント取得エラー:', error);
        return null;
    }

    if (!data) {
        return null;
    }

    return {
        userId: session.user.id,
        loginId: data.login_id,
        storeId: data.store_id,
        store: data.stores
    };
}

/**
 * OSM上の店舗が既に登録済みか確認する
 */
export async function getRegisteredStoreByOsm(osmType, osmId) {
    if (!supabaseInitialized) {
        return null;
    }

    const { data, error } = await supabase
        .from('stores')
        .select('id, name, osm_type, osm_id')
        .eq('osm_type', osmType)
        .eq('osm_id', osmId)
        .maybeSingle();

    if (error) {
        console.error('OSM店舗検索エラー:', error);
        return null;
    }

    return data;
}

/**
 * 店舗ログインIDとパスワードでログインする
 */
export async function signInStore(loginId, password) {
    if (!supabaseInitialized) {
        return { success: false, error: 'Supabaseが初期化されていません。' };
    }

    const normalizedId = parseInt(String(loginId).replace(/\D/g, ''), 10);
    if (!normalizedId || normalizedId < 100000) {
        return { success: false, error: '店舗ログインID（6桁の数字）を入力してください。' };
    }

    const email = loginIdToAuthEmail(normalizedId);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { success: false, error: 'ログインIDまたはパスワードが正しくありません。' };
    }

    const account = await getStoreAccount();
    if (!account) {
        await supabase.auth.signOut();
        return { success: false, error: '店舗アカウントが紐付いていません。' };
    }

    return { success: true, user: data.user, account };
}

/**
 * OSM店舗を選択して新規登録（ログインID・初期パスワードはシステム発行）
 */
export async function registerStoreAccount({ storePayload }) {
    if (!supabaseInitialized) {
        return { success: false, error: 'Supabaseが初期化されていません。' };
    }

    const { osm_type, osm_id, name, latitude, longitude, address } = storePayload;

    if (!osm_type || !osm_id || !name || latitude == null || longitude == null) {
        return { success: false, error: '店舗情報が不足しています。' };
    }

    const existing = await getRegisteredStoreByOsm(osm_type, osm_id);
    if (existing) {
        return { success: false, error: 'この店舗は既に登録されています。' };
    }

    let loginId;
    let password;
    try {
        loginId = await allocateLoginId();
        password = generateStorePassword(10);
    } catch (err) {
        return { success: false, error: err.message };
    }

    const email = loginIdToAuthEmail(loginId);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { login_id: loginId, role: 'store' }
        }
    });

    if (signUpError) {
        return { success: false, error: signUpError.message };
    }

    if (!signUpData.user) {
        return { success: false, error: 'アカウントの作成に失敗しました。' };
    }

    const { data: storeRow, error: storeError } = await supabase
        .from('stores')
        .insert({
            name,
            latitude,
            longitude,
            address: address || null,
            osm_type,
            osm_id,
            claimed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (storeError) {
        await supabase.auth.signOut();
        if (storeError.code === '23505') {
            return { success: false, error: 'この店舗は既に登録されています。' };
        }
        return { success: false, error: `店舗の登録に失敗しました: ${storeError.message}` };
    }

    const { error: linkError } = await supabase
        .from('store_accounts')
        .insert({
            id: signUpData.user.id,
            store_id: storeRow.id,
            login_id: loginId
        });

    if (linkError) {
        await supabase.auth.signOut();
        return { success: false, error: `アカウントの紐付けに失敗しました: ${linkError.message}` };
    }

    return {
        success: true,
        user: signUpData.user,
        store: storeRow,
        storeId: storeRow.id,
        loginId,
        password
    };
}

/**
 * ログアウトする
 */
export async function signOutStore() {
    if (!supabaseInitialized) {
        return { success: true };
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true };
}

/**
 * 認証が必要なルート用：未ログインならログイン画面へ誘導するHTML
 */
export function getAuthRequiredHTML(message = '店舗ログインが必要です') {
    return `
    <div class="empty-state">
      <div class="empty-icon">🔐</div>
      <p class="empty-text">${message}</p>
      <div class="flex flex-col gap-3 mt-6 items-center">
        <button type="button" id="go-store-login" class="btn-primary">ログイン</button>
        <button type="button" id="go-store-register" class="btn-secondary">新規店舗登録</button>
        <button type="button" id="back-button" class="btn-back mt-2">ホームに戻る</button>
      </div>
    </div>
  `;
}

/**
 * 認証必須画面の共通ボタンイベント
 */
export function attachAuthRequiredEvents() {
    document.getElementById('go-store-login')?.addEventListener('click', () => {
        window.location.hash = '/store/login';
    });
    document.getElementById('go-store-register')?.addEventListener('click', () => {
        window.location.hash = '/store/register';
    });
    document.getElementById('back-button')?.addEventListener('click', () => {
        window.location.hash = '/home';
    });
}
