/**
 * 日時フォーマットユーティリティ
 */

/**
 * ISO形式の日時文字列を日本語の見やすい形式に変換
 * 例: "2025-07-19T10:57:15.819046+09:00" → "2025年07月19日 10:57"
 */
export const formatDateTime = (isoString: string | null | undefined): string => {
	if (!isoString) return "-"

	try {
		const date = new Date(isoString)

		// 無効な日付の場合
		if (Number.isNaN(date.getTime())) {
			return "-"
		}

		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, "0")
		const day = String(date.getDate()).padStart(2, "0")
		const hours = String(date.getHours()).padStart(2, "0")
		const minutes = String(date.getMinutes()).padStart(2, "0")

		return `${year}年${month}月${day}日 ${hours}:${minutes}`
	} catch (error) {
		console.warn("日時フォーマットエラー:", error)
		return "-"
	}
}

/**
 * ISO形式の日付文字列を日本語の日付形式に変換
 * 例: "1980-01-01" → "1980年01月01日"
 */
export const formatDate = (dateString: string | null | undefined): string => {
	if (!dateString) return "-"

	try {
		// 日付のみの場合（YYYY-MM-DD形式）
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			const [year, month, day] = dateString.split("-")
			return `${year}年${month}月${day}日`
		}

		// 日時形式の場合
		const date = new Date(dateString)
		if (Number.isNaN(date.getTime())) {
			return "-"
		}

		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, "0")
		const day = String(date.getDate()).padStart(2, "0")

		return `${year}年${month}月${day}日`
	} catch (error) {
		console.warn("日付フォーマットエラー:", error)
		return "-"
	}
}
