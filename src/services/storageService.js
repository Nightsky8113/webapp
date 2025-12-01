/**
 * Supabase Storageを使用したチラシ画像のアップロード・管理サービス
 * 画像ファイルの検証、アップロード、URL取得、削除などの機能を提供する
 */

import { supabase, supabaseInitialized } from './supabase.js';

const BUCKET_NAME = 'flyer-images';
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

/**
 * アップロード前にファイルの形式とサイズを検証する
 * ファイルサイズが制限を超えている、または対応していない形式の場合はエラーを返す
 */
function validateImageFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでです。`
        };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `対応していないファイル形式です。対応形式: ${ALLOWED_MIME_TYPES.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * 店舗IDとタイムスタンプ、ファイル名から一意のファイルパスを生成する
 * ファイル名は安全な形式にサニタイズし、店舗ごとにフォルダ分けして整理する
 */
function generateFilePath(storeId, file) {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${storeId}/${timestamp}_${sanitizedFileName}`;
}

/**
 * チラシ画像をSupabase Storageにアップロードし、公開URLを取得する
 * ファイル検証後にアップロードを実行し、成功した場合は公開URLを返す
 */
export async function uploadFlyerImage(file, storeId, options = {}) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。環境変数を確認してください。'
        };
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error
        };
    }

    try {
        const filePath = options.oldPath || generateFilePath(storeId, file);

        // 更新時に既存ファイルを削除してストレージ容量を節約
        if (options.oldPath && options.oldPath !== filePath) {
            await deleteImage(options.oldPath);
        }

        console.log('画像をアップロード中...', { filePath, storeId });
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('画像アップロードエラー:', error);
            return {
                success: false,
                error: `アップロードに失敗しました: ${error.message}`
            };
        }

        const url = await getImageUrl(filePath);

        return {
            success: true,
            path: filePath,
            url: url
        };
    } catch (error) {
        console.error('画像アップロードエラー:', error);
        return {
            success: false,
            error: `予期しないエラーが発生しました: ${error.message}`
        };
    }
}

/**
 * 指定されたファイルパスに対応する公開URLを生成する
 * このURLはブラウザから直接画像を表示する際に使用される
 */
export async function getImageUrl(path) {
    if (!supabaseInitialized) {
        return '';
    }

    try {
        const { data } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

        return data.publicUrl;
    } catch (error) {
        console.error('URL取得エラー:', error);
        return '';
    }
}

/**
 * Supabase Storageから指定されたファイルパスの画像を削除する
 * 画像更新時や不要になった画像の削除に使用される
 */
export async function deleteImage(path) {
    if (!supabaseInitialized) {
        return {
            success: false,
            error: 'Supabaseが初期化されていません。'
        };
    }

    try {
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([path]);

        if (error) {
            console.error('画像削除エラー:', error);
            return {
                success: false,
                error: `削除に失敗しました: ${error.message}`
            };
        }

        return {
            success: true
        };
    } catch (error) {
        console.error('画像削除エラー:', error);
        return {
            success: false,
            error: `予期しないエラーが発生しました: ${error.message}`
        };
    }
}

/**
 * 指定された店舗に関連するすべての画像ファイルのリストを取得する
 * 各画像のメタデータ（ファイル名、サイズ、作成日時など）と公開URLを含む
 */
export async function listStoreImages(storeId) {
    if (!supabaseInitialized) {
        return [];
    }

    try {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list(`${storeId}/`, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.error('画像一覧取得エラー:', error);
            return [];
        }

        const images = await Promise.all(
            (data || []).map(async (file) => {
                const path = `${storeId}/${file.name}`;
                const url = await getImageUrl(path);
                return {
                    name: file.name,
                    path: path,
                    url: url,
                    size: file.metadata?.size || 0,
                    created_at: file.created_at
                };
            })
        );

        return images;
    } catch (error) {
        console.error('画像一覧取得エラー:', error);
        return [];
    }
}

/**
 * 元画像のURLからサムネイルURLを生成する
 * 現在は元画像のURLをそのまま返す（将来、Supabase Storageの画像変換APIを使用して最適化可能）
 */
export function getThumbnailUrl(imageUrl) {
    return imageUrl;
}

/**
 * 画像をSupabase Storageにアップロードし、そのURLをデータベースのflyersテーブルに保存する統合関数
 * 画像アップロードとデータベース保存を1つの処理として実行し、エラー発生時は適切にハンドリングする
 * 管理画面でのチラシ画像アップロード時に使用される
 */
export async function uploadAndSaveFlyer(file, storeId, options = {}) {
    const uploadResult = await uploadFlyerImage(file, storeId, {
        oldPath: options.oldPath
    });

    if (!uploadResult.success) {
        return {
            success: false,
            error: uploadResult.error
        };
    }

    try {
        const { createFlyer } = await import('./dataService.js');

        const flyerData = {
            store_id: storeId,
            image_url: uploadResult.url,
            thumbnail_url: options.thumbnailUrl || uploadResult.url,
            is_latest: options.is_latest !== undefined ? options.is_latest : true,
            ocr_done: options.ocr_done !== undefined ? options.ocr_done : false
        };

        const saveResult = await createFlyer(flyerData);

        if (!saveResult.success) {
            return {
                success: false,
                error: saveResult.error
            };
        }

        return {
            success: true,
            flyer: saveResult.data,
            imageUrl: uploadResult.url,
            imagePath: uploadResult.path
        };
    } catch (error) {
        console.error('データベース保存エラー:', error);
        return {
            success: false,
            error: `データベース保存に失敗しました: ${error.message}`
        };
    }
}

