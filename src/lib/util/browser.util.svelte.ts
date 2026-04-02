export class BrowserUtil {
	isMobile(): boolean {
		return /Mobi|Android/i.test(navigator.userAgent);
	}

	isTouchDevice(): boolean {
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	}

	isDarkMode(): boolean {
		return (
			window.matchMedia &&
			window.matchMedia('(prefers-color-scheme: dark)').matches
		);
	}
	isOnline(): boolean {
		return navigator.onLine;
	}

	reloadPage(): void {
		window.location.reload();
	}

	openInNewTab(url: string): void {
		window.open(url, '_blank', 'noopener,noreferrer');
	}
	copyToClipboard(text: string): void {
		navigator.clipboard.writeText(text).catch((err) => {
			console.error('Could not copy text', err);
		});
	}
	fullScreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.error('Error enabling full-screen mode', err);
			});
		} else {
			document.exitFullscreen();
		}
	}

	getViewportSize(): { width: number; height: number } {
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	}

	getScrollPosition(): { x: number; y: number } {
		return {
			x: window.scrollX,
			y: window.scrollY
		};
	}
	scrollToTop(): void {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	scrollToBottom(): void {
		window.scrollTo({
			top: document.body.scrollHeight,
			behavior: 'smooth'
		});
	}
	scrollToElement(id: string): void {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}
}
