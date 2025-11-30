/**
 * HTMLテンプレートの読み込みと変数置換を管理するユーティリティ
 * HTMLファイルからJavaScriptを分離するために使用され、動的なコンテンツ生成を可能にする
 */

/**
 * 指定されたパスのHTMLテンプレートファイルを非同期で読み込む
 * ファイルが見つからない場合や空の場合はエラーをスローし、呼び出し側でフォールバック処理ができるようにする
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
        throw new Error(`Template loading failed: ${path} - ${error.message}`);
    }
}

/**
 * テンプレート文字列内の変数、条件分岐、配列ループを処理してHTMLを生成する
 * ${key}形式の変数置換、${if:key}...${endif}形式の条件分岐、${each:array}...${endeach}形式のループ処理に対応
 */
export function renderTemplate(template, data = {}) {
    let html = template;
    
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        html = html.replace(regex, data[key]);
    });
    
    html = html.replace(/\$\{if:([^}]+)\}([\s\S]*?)\$\{endif\}/g, (match, condition, content) => {
        const conditionValue = data[condition];
        if (conditionValue && conditionValue !== false && conditionValue !== '') {
            return content;
        }
        return '';
    });
    
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
 * テンプレートファイルを読み込み、データを適用してレンダリング後のHTML文字列を返す
 * テンプレート読み込みと変数置換を1つの処理として実行する便利関数
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
        throw error;
    }
}

