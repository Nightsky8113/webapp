import { escapeHtml } from '../utils/helpers.js';
import { loadAndRenderTemplate } from '../utils/template.js';

/**
 * ジャンル情報を表示するカードコンポーネントを生成する
 * ジャンル名とアイコンを表示し、クリックでジャンル別店舗検索ページへ遷移できるようにする
 */
export async function GenreCard(genre) {
    if (!genre) return '';

    const genreName = escapeHtml(genre.name);
    const icon = genre.icon || '📦';

    const templateData = {
        id: genre.id,
        genreName: genreName,
        icon: icon
    };

    try {
        return await loadAndRenderTemplate('/src/templates/components/genre-card.html', templateData);
    } catch (error) {
        console.warn('テンプレート読み込み失敗、フォールバックを使用:', error);
        return `
        <button
          class="genre-card"
          data-genre-id="${genre.id}"
          aria-label="${genreName}ジャンルで検索"
        >
          <div class="text-6xl mb-4">${icon}</div>
          <div class="font-bold text-gray-800 text-lg mb-2">${genreName}</div>
          <div class="text-blue-600 text-xs font-medium">選択する →</div>
        </button>
      `;
    }
}

/**
 * ジャンルカードのクリックイベントをイベントデリゲーションで設定する
 * 動的に追加されるカードにも対応できるよう、コンテナ要素で一括管理する
 */
export function attachGenreCardEvents(container, onCardClick) {
    if (!container) return;

    container.addEventListener('click', async (e) => {
        const card = e.target.closest('[data-genre-id]');
        if (card) {
            const genreId = parseInt(card.dataset.genreId);
            if (onCardClick && typeof onCardClick === 'function') {
                const result = onCardClick(genreId);
                if (result instanceof Promise) {
                    await result;
                }
            }
        }
    });
}