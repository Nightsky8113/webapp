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
    
    // データ値にテンプレートタグが含まれている場合は、一時的にプレースホルダーに置換
    // これにより、親テンプレートのレンダリング時に子テンプレートのタグが処理されないようにする
    const placeholders = new Map();
    let placeholderIndex = 0;
    const placeholderPrefix = '__PLACEHOLDER_';
    
    // データ値からテンプレートタグを含むものを一時的に置換
    const processedData = {};
    Object.keys(data).forEach(key => {
        let value = data[key];
        if (typeof value === 'string' && (value.includes('${') || value.includes('${if:') || value.includes('${endif}'))) {
            const placeholder = `${placeholderPrefix}${placeholderIndex++}__`;
            placeholders.set(placeholder, value);
            processedData[key] = placeholder;
        } else {
            processedData[key] = value;
        }
    });
    
    // まず条件分岐を処理（ネストされた条件分岐も正しく処理する）
    // 外側から内側へ、再帰的に処理する必要がある
    let maxIterations = 10; // 無限ループを防ぐ
    let iteration = 0;
    
    while (html.includes('${if:') && iteration < maxIterations) {
        iteration++;
        html = html.replace(/\$\{if:([^}]+)\}([\s\S]*?)\$\{endif\}/g, (match, condition, content) => {
            // プレースホルダー内でないことを確認
            if (match.includes(placeholderPrefix)) {
                return match; // プレースホルダー内のタグは処理しない
            }
            
            // 条件名から否定演算子をチェック
            let conditionName = condition.trim();
            let isNegated = false;
            if (conditionName.startsWith('!')) {
                conditionName = conditionName.substring(1).trim();
                isNegated = true;
            }
            
            const conditionValue = processedData[conditionName] !== undefined ? processedData[conditionName] : data[conditionName];
            let shouldShow = false;
            
            if (isNegated) {
                // 否定条件: 値がfalse、null、undefined、空文字列の場合に表示
                shouldShow = !conditionValue || conditionValue === false || conditionValue === '';
            } else {
                // 通常条件: 値がtruthyの場合に表示
                shouldShow = conditionValue && conditionValue !== false && conditionValue !== '';
            }
            
            if (shouldShow) {
                return content;
            }
            return '';
        });
    }
    
    // 次にeachループを処理
    html = html.replace(/\$\{each:([^}]+)\}([\s\S]*?)\$\{endeach\}/g, (match, arrayKey, content) => {
        if (match.includes(placeholderPrefix)) {
            return match; // プレースホルダー内のタグは処理しない
        }
        
        const array = processedData[arrayKey] !== undefined ? processedData[arrayKey] : (data[arrayKey] || []);
        return array.map(item => {
            let itemHtml = content;
            Object.keys(item).forEach(key => {
                const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
                itemHtml = itemHtml.replace(regex, item[key]);
            });
            return itemHtml;
        }).join('');
    });
    
    // 最後に変数置換を処理
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        let value = processedData[key] !== undefined ? processedData[key] : data[key];
        // nullやundefinedの場合は空文字列にする（"null"という文字列が表示されるのを防ぐ）
        if (value === null || value === undefined) {
            value = '';
        } else if (typeof value === 'object') {
            // オブジェクトの場合はJSON文字列に変換（デバッグ用）
            value = JSON.stringify(value);
        }
        html = html.replace(regex, value);
    });
    
    // プレースホルダーを元の値に戻す
    placeholders.forEach((value, placeholder) => {
        html = html.replace(placeholder, value);
    });
    
    // 処理されずに残ったテンプレートタグを削除（表示されないようにする）
    html = html.replace(/\$\{if:[^}]+\}/g, '');
    html = html.replace(/\$\{endif\}/g, '');
    html = html.replace(/\$\{each:[^}]+\}/g, '');
    html = html.replace(/\$\{endeach\}/g, '');
    
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

