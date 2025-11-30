/**
 * Lightbox2ライブラリを使用した画像拡大表示機能を提供するユーティリティ
 * 動的に追加された画像要素にも対応できるよう、初期化処理を管理する
 */

/**
 * jQueryとLightbox2ライブラリが読み込まれているかどうかを確認する
 */
export function isLightboxLoaded() {
    return typeof window.jQuery !== 'undefined' && typeof window.lightbox !== 'undefined';
}

/**
 * Lightbox2を初期化し、画像拡大表示の設定を行う
 * 動的に追加された要素にも対応できるよう、再初期化処理を実行する
 */
export function initLightbox() {
    if (!isLightboxLoaded()) {
        console.warn('⚠️ jQueryまたはLightbox2が読み込まれていません');
        return false;
    }

    try {
        if (typeof window.lightbox !== 'undefined') {
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
 * Lightbox2の初期化を自動リトライ機能付きで実行する
 * ライブラリの読み込みが遅延している場合でも、最大指定回数まで繰り返し試行する
 * 動的にコンテンツが追加されるページ遷移後などに使用する
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

