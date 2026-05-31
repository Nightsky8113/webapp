import { showOCRResultModal } from '../components/OCRResultModal.js';
import {
    processFlyerOCRWithoutSave,
    saveOCRItemsToDatabase,
    updateOCRStatus
} from '../services/ocrService.js';
import { uploadAndSaveFlyer } from '../services/storageService.js';
import { resetUploadPreview, showUploadStatus } from './uploadUi.js';

/**
 * チラシ画像アップロード（任意でOCR → 確認モーダル → 商品保存）
 */
export async function submitFlyerUpload({
    file,
    storeId,
    enableOcr,
    uploadStatus,
    uploadButton,
    uploadForm,
    previewArea
}) {
    const setButton = (disabled, text) => {
        if (!uploadButton) return;
        uploadButton.disabled = disabled;
        uploadButton.textContent = text;
    };

    setButton(true, 'アップロード中...');
    showUploadStatus(uploadStatus, 'アップロード中...', 'loading');

    try {
        const result = await uploadAndSaveFlyer(file, storeId, {
            is_latest: true,
            ocr_done: false
        });

        if (!result.success) {
            showUploadStatus(uploadStatus, `エラー: ${result.error}`, 'error');
            return;
        }

        const flyerId = result.flyer.id;
        const imageUrl = result.imageUrl || result.flyer.image_url;

        if (!enableOcr) {
            showUploadStatus(
                uploadStatus,
                `アップロード成功（チラシID: ${flyerId}）`,
                'success'
            );
            uploadForm?.reset();
            resetUploadPreview(previewArea);
            setTimeout(() => uploadStatus?.classList.add('hidden'), 3000);
            return;
        }

        setButton(true, 'OCR処理中...');
        showUploadStatus(
            uploadStatus,
            'OCR処理中です。1〜2分かかる場合があります...',
            'loading'
        );

        const ocrResult = await processFlyerOCRWithoutSave(imageUrl, storeId);

        if (!ocrResult.success) {
            showUploadStatus(
                uploadStatus,
                `アップロードは成功しましたが、OCRに失敗しました: ${ocrResult.error}`,
                'error'
            );
            return;
        }

        if (!ocrResult.items?.length) {
            showUploadStatus(
                uploadStatus,
                `アップロード成功（チラシID: ${flyerId}）。商品は抽出されませんでした。`,
                'success'
            );
            uploadForm?.reset();
            resetUploadPreview(previewArea);
            return;
        }

        showUploadStatus(uploadStatus, '抽出結果を確認してください', 'success');

        showOCRResultModal(
            ocrResult.items,
            async (selectedItems) => {
                if (!selectedItems.length) {
                    showUploadStatus(uploadStatus, '追加する商品が選択されていません', 'error');
                    return;
                }

                setButton(true, '商品を保存中...');
                showUploadStatus(uploadStatus, '商品を保存中...', 'loading');

                const saveResult = await saveOCRItemsToDatabase(
                    selectedItems,
                    flyerId,
                    storeId
                );

                if (!saveResult.success) {
                    showUploadStatus(
                        uploadStatus,
                        `商品の保存に失敗しました: ${saveResult.error}`,
                        'error'
                    );
                    return;
                }

                await updateOCRStatus(flyerId, true);

                showUploadStatus(
                    uploadStatus,
                    `完了: チラシID ${flyerId}、${saveResult.savedCount ?? selectedItems.length}件の商品を追加しました`,
                    'success'
                );
                uploadForm?.reset();
                resetUploadPreview(previewArea);
                setTimeout(() => uploadStatus?.classList.add('hidden'), 5000);
            },
            () => {
                showUploadStatus(
                    uploadStatus,
                    `アップロードのみ完了（チラシID: ${flyerId}）。商品は追加されませんでした。`,
                    'success'
                );
                uploadForm?.reset();
                resetUploadPreview(previewArea);
            }
        );
    } catch (error) {
        console.error('アップロードエラー:', error);
        showUploadStatus(uploadStatus, `予期しないエラー: ${error.message}`, 'error');
    } finally {
        setButton(false, 'アップロード');
    }
}
