/**
 * フィルター/検索パラメータをURLのクエリパラメータに変換するユーティリティ
 */

/**
 * オブジェクトをURLSearchParamsに変換
 * undefined、null、空文字列の値は除外されます
 *
 * @param params - クエリパラメータとして変換するオブジェクト
 * @returns URLSearchParams オブジェクト
 *
 * @example
 * const params = { search_term: 'test', type: 'BLACKLIST', page: undefined };
 * const searchParams = buildQueryParams(params);
 * // 結果: URLSearchParams { 'search_term' => 'test', 'type' => 'BLACKLIST' }
 */
export const buildQueryParams = (
	params: Record<string, string | number | boolean | undefined | null>
): URLSearchParams => {
	const searchParams = new URLSearchParams()

	for (const [key, value] of Object.entries(params)) {
		// undefined、null、空文字列は除外
		if (value !== undefined && value !== null && value !== "") {
			searchParams.append(key, String(value))
		}
	}

	return searchParams
}

/**
 * オブジェクトをクエリ文字列に変換
 * undefined、null、空文字列の値は除外されます
 *
 * @param params - クエリパラメータとして変換するオブジェクト
 * @returns クエリ文字列（先頭に '?' は付きません）
 *
 * @example
 * const params = { search_term: 'test', type: 'BLACKLIST', page: undefined };
 * const queryString = buildQueryString(params);
 * // 結果: 'search_term=test&type=BLACKLIST'
 */
export const buildQueryString = (
	params: Record<string, string | number | boolean | undefined | null>
): string => {
	return buildQueryParams(params).toString()
}

/**
 * 現在のURLにクエリパラメータを追加/更新
 *
 * @param baseUrl - ベースとなるURL
 * @param params - 追加/更新するクエリパラメータ
 * @returns クエリパラメータが追加されたURL
 *
 * @example
 * const url = addQueryParams('/api/blacklist', { search_term: 'test', page: 1 });
 * // 結果: '/api/blacklist?search_term=test&page=1'
 */
export const addQueryParams = (
	baseUrl: string,
	params: Record<string, string | number | boolean | undefined | null>
): string => {
	const queryString = buildQueryString(params)
	if (!queryString) {
		return baseUrl
	}

	const separator = baseUrl.includes("?") ? "&" : "?"
	return `${baseUrl}${separator}${queryString}`
}

/**
 * URLSearchParamsをオブジェクトに変換
 *
 * @param searchParams - URLSearchParams オブジェクト
 * @returns クエリパラメータのオブジェクト
 *
 * @example
 * const searchParams = new URLSearchParams('search_term=test&page=1');
 * const params = parseQueryParams(searchParams);
 * // 結果: { search_term: 'test', page: '1' }
 */
export const parseQueryParams = (searchParams: URLSearchParams): Record<string, string> => {
	const params: Record<string, string> = {}

	for (const [key, value] of searchParams.entries()) {
		params[key] = value
	}

	return params
}
