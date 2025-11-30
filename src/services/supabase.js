
/**
 * Supabase Client設定
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数から取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase接続の確認
let supabase = null;
let supabaseInitialized = false;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase環境変数が設定されていません。モックデータを使用します。');
} else {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false // 認証機能は後で追加
            }
        });
        supabaseInitialized = true;
        console.log('✅ Supabase接続成功');
    } catch (error) {
        console.error('❌ Supabase接続エラー:', error);
    }
}

// ダミーのsupabaseオブジェクトをエクスポート（環境変数がない場合のフォールバック）
if (!supabaseInitialized) {
    supabase = {
        from: () => ({
            select: () => ({ data: [], error: null }),
            insert: () => ({ data: null, error: { message: 'Supabase not initialized' } }),
            update: () => ({ data: null, error: { message: 'Supabase not initialized' } }),
            delete: () => ({ data: null, error: { message: 'Supabase not initialized' } })
        })
    };
}

export { supabase, supabaseInitialized };