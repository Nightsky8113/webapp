/**
 * Lightbox2ユーティリティ
 * 動的に追加された要素に対してLightbox2を初期化する
 */

/**
 * jQueryとLightbox2が読み込まれているか確認
 */
export function isLightboxLoaded() {
    return typeof window.jQuery !== 'undefined' && typeof window.lightbox !== 'undefined';
}

/**
 * Lightbox2を初期化（動的に追加された要素に対応）
 */
export function initLightbox() {
    if (!isLightboxLoaded()) {
        console.warn('⚠️ jQueryまたはLightbox2が読み込まれていません');
        return false;
    }

    try {
        if (typeof window.lightbox !== 'undefined') {
            // Lightbox2のオプションを設定
            window.lightbox.option({
                'resizeDuration': 200,
                'wrapAround': false,
                'disableScrolling': true,
                'fadeDuration': 300,
                'imageFadeDuration': 300,
                'maxWidth': 1200,
                'maxHeight': 1200,
                'fitImagesInViewport': true,
                'showImageNumberLabel': false
            });

            // 動的に追加された要素に対してLightboxを再初期化
            window.lightbox.init();
            console.log('✅ Lightbox2 initialized');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Lightbox2初期化エラー:', error);
        return false;
    }
}

/**
 * Lightbox2の初期化を試みる（複数回試行可能）
 * @param {number} maxRetries - 最大リトライ回数
 * @param {number} delay - リトライ間隔（ms）
 */
export function initLightboxWithRetry(maxRetries = 5, delay = 200) {
    let retries = 0;

    const tryInit = () => {
        if (isLightboxLoaded()) {
            return initLightbox();
        } else if (retries < maxRetries) {
            retries++;
            setTimeout(tryInit, delay);
            return false;
        } else {
            console.warn('⚠️ Lightbox2の読み込みを確認できませんでした');
            return false;
        }
    };

    return tryInit();
}

