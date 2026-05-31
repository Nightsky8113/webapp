
/**
 * Supabaseクライアントの初期化と管理
 * 環境変数が設定されていない場合は、アプリがクラッシュしないようダミーオブジェクトを提供する
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
let supabaseInitialized = false;

// 環境変数が設定されている場合のみSupabaseクライアントを初期化
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase環境変数が設定されていません。モックデータを使用します。');
    console.warn('   VITE_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定');
    console.warn('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '設定済み' : '未設定');
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        supabaseInitialized = true;
        console.log('✅ Supabase接続成功');
    } catch (error) {
        console.error('❌ Supabase接続エラー:', error);
    }
}

// 開発環境や環境変数未設定時でもアプリが動作するよう、ダミーオブジェクトを提供
// これにより、Supabaseが初期化されていない場合でも他のモジュールが正常に動作する
if (!supabaseInitialized) {
    supabase = {
        from: () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: { message: 'Supabase not initialized' } }),
            update: () => ({ data: null, error: { message: 'Supabase not initialized' } }),
            delete: () => ({ data: null, error: { message: 'Supabase not initialized' } })
        }),
        storage: {
            from: () => ({
                upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
                remove: () => Promise.resolve({ error: { message: 'Supabase not initialized' } }),
                list: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
                getPublicUrl: () => ({ data: { publicUrl: '' } })
            })
        },
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not initialized' } }),
            signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not initialized' } }),
            signOut: () => Promise.resolve({ error: null })
        }
    };
}

export { supabase, supabaseInitialized };