
/**
 * Supabase Client設定
 */

import { createClient } from '@supabase/supabase-js';

// 環境変数から取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase環境変数が設定されていません');
}

// Supabase Clientを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false // 認証機能は後で追加
    }
});