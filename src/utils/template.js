/**
 * テンプレートユーティリティ
 * HTMLテンプレートの読み込みと変数置換を管理
 */

/**
 * HTMLテンプレートファイルを読み込む
 * @param {string} path - テンプレートファイルのパス
 * @returns {Promise<string>} テンプレートHTML文字列
 */
export async function loadTemplate(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${path} (${response.status} ${response.statusText})`);
        }
        const text = await response.text();
        if (!text || text.trim().length === 0) {
            throw new Error(`Template file is empty: ${path}`);
        }
        return text;
    } catch (error) {
        console.error(`❌ Template load error: ${path}`, error);
        // 空文字列を返すのではなく、エラーを再スローして呼び出し側で処理できるようにする
        throw new Error(`Template loading failed: ${path} - ${error.message}`);
    }
}

/**
 * テンプレート文字列内の変数を置換
 * @param {string} template - テンプレート文字列
 * @param {Object} data - 置換用データ
 * @returns {string} 置換後のHTML文字列
 */
export function renderTemplate(template, data = {}) {
    let html = template;
    
    // ${key}形式の変数を置換
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        html = html.replace(regex, data[key]);
    });
    
    // 条件分岐の処理 (${if:key} ... ${endif})
    html = html.replace(/\$\{if:([^}]+)\}([\s\S]*?)\$\{endif\}/g, (match, condition, content) => {
        const conditionValue = data[condition];
        if (conditionValue && conditionValue !== false && conditionValue !== '') {
            return content;
        }
        return '';
    });
    
    // 配列のループ処理 (${each:array} ... ${endeach})
    html = html.replace(/\$\{each:([^}]+)\}([\s\S]*?)\$\{endeach\}/g, (match, arrayKey, content) => {
        const array = data[arrayKey] || [];
        return array.map(item => {
            let itemHtml = content;
            Object.keys(item).forEach(key => {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                itemHtml = itemHtml.replace(regex, item[key]);
            });
            return itemHtml;
        }).join('');
    });
    
    return html;
}

/**
 * HTMLテンプレートファイルを読み込んでレンダリング
 * @param {string} path - テンプレートファイルのパス
 * @param {Object} data - 置換用データ
 * @returns {Promise<string>} レンダリング後のHTML文字列
 */
export async function loadAndRenderTemplate(path, data = {}) {
    try {
        const template = await loadTemplate(path);
        if (!template) {
            throw new Error(`Template is empty: ${path}`);
        }
        return renderTemplate(template, data);
    } catch (error) {
        console.error(`❌ Failed to load and render template: ${path}`, error);
        // エラーを再スローして、呼び出し側でフォールバック処理ができるようにする
        throw error;
    }
}

