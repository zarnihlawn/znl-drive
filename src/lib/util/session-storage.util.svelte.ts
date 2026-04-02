export class SessionStorageUtil {
	constructor() {}

	setItem<T>(key: string, value: T): void {
		try {
			const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
			sessionStorage.setItem(key, stringValue);
		} catch (error) {
			console.error('Failed to set item in sessionStorage:', error);
		}
	}

	getItem<T>(key: string): T | null {
		try {
			const item = sessionStorage.getItem(key);
			if (!item) return null;

			try {
				return JSON.parse(item) as T;
			} catch {
				return item as unknown as T;
			}
		} catch (error) {
			console.error('Failed to get item from sessionStorage:', error);
			return null;
		}
	}

	removeItem(key: string): void {
		try {
			sessionStorage.removeItem(key);
		} catch (error) {
			console.error('Failed to remove item from sessionStorage:', error);
		}
	}

	clear(): void {
		try {
			sessionStorage.clear();
		} catch (error) {
			console.error('Failed to clear sessionStorage:', error);
		}
	}
}
