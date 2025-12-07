/**
 * 電話番号からハイフンを削除するユーティリティ関数
 */
export const removePhoneHyphens = (phoneNumber: string): string => {
	if (!phoneNumber) return phoneNumber
	return phoneNumber.replace(/-/g, "")
}

/**
 * 電話番号が有効な形式かチェックする関数
 */
export const isValidPhoneFormat = (phoneNumber: string): boolean => {
	if (!phoneNumber) return false
	// ハイフンを削除してから数字のみかチェック
	const cleaned = removePhoneHyphens(phoneNumber)
	return /^\d+$/.test(cleaned)
}

/**
 * 電話番号検索用のパターンを生成する関数
 * ハイフンありとなしの両方のパターンを返す
 */
export const generatePhoneSearchPatterns = (phoneNumber: string): string[] => {
	if (!phoneNumber) return []

	const cleaned = removePhoneHyphens(phoneNumber)
	if (!isValidPhoneFormat(phoneNumber)) return [phoneNumber] // 電話番号でない場合はそのまま返す

	// ハイフンなしパターン
	const withoutHyphens = cleaned

	// ハイフンありパターン（一般的な日本の電話番号形式）
	let withHyphens = ""
	if (cleaned.length === 11 && cleaned.startsWith("0")) {
		// 携帯電話の場合: 090-1234-5678
		withHyphens = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
	} else if (cleaned.length === 10 && cleaned.startsWith("0")) {
		// 固定電話の場合: 03-1234-5678 または 06-1234-5678
		if (cleaned.startsWith("03") || cleaned.startsWith("06")) {
			withHyphens = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
		} else {
			withHyphens = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
		}
	} else {
		// その他の場合は元の形式を使用
		withHyphens = phoneNumber
	}

	// 重複を除去して両方のパターンを返す
	const patterns = [withoutHyphens, withHyphens]
	return [...new Set(patterns)]
}

/**
 * 電話番号かどうかを判定する関数（改良版）
 */
export const isPhoneNumber = (input: string): boolean => {
	if (!input) return false
	// 数字とハイフンのみ、かつハイフンが含まれているまたは数字のみで10-11桁
	const cleaned = removePhoneHyphens(input)
	return /^\d{10,11}$/.test(cleaned)
}

/**
 * 文字列が半角文字のみかチェックする関数
 */
export const isHalfWidth = (input: string): boolean => {
	if (!input) return true
	// 半角文字のみ（ASCII文字）のパターン
	return /^[\x20-\x7E]*$/.test(input)
}
