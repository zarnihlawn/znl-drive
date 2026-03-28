<script lang="ts">
	import { LucideCircleUser, LucideCloudUpload, LucideMenu } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { SiGithub } from '@icons-pack/svelte-simple-icons';

	let { children } = $props();
</script>

<svelte:head>
	<title>Onboarding | ZNL-DRIVE</title>
</svelte:head>

<div class="my-web">
	<div class="d-navbar bg-base-100 shadow-sm">
		<div class="d-navbar-start">
			<div class="d-dropdown">
				<div tabindex="0" role="button" class="d-btn d-btn-ghost lg:hidden">
					<LucideMenu class="h-5 w-5" />
				</div>
				<ul
					tabindex="-1"
					class="d-dropdown-content d-menu z-1 mt-3 w-52 d-menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a href={resolve('/(public)/onboarding/docs')}>Docs</a></li>
					<li><a href={resolve('/(public)/onboarding/blogs')}>Blogs</a></li>
					<li><a href={resolve('/(public)/onboarding/pricing')}>Pricing</a></li>
				</ul>
			</div>
			<a class="d-btn text-xl d-btn-ghost" href={resolve('/(public)/onboarding')}>ZNL-DRIVE</a>
		</div>
		<div class="d-navbar-center hidden lg:flex">
			<ul class="d-menu d-menu-horizontal gap-5 px-1">
				<li><a href={resolve('/(public)/onboarding/docs')}>Docs</a></li>
				<li><a href={resolve('/(public)/onboarding/blogs')}>Blogs</a></li>
				<li><a href={resolve('/(public)/onboarding/pricing')}>Pricing</a></li>
			</ul>
		</div>
		<div class="d-navbar-end gap-5">
			<a href={resolve('/(public)/auth/signup')} class="d-btn d-btn-outline">SIGN UP</a>
			<a href={resolve('/(public)/auth/login')} class="d-btn d-btn-primary">LOGIN</a>
		</div>
	</div>
	<main class="my-main">
		{@render children?.()}
	</main>
	<footer class="d-footer-center d-footer d-footer-horizontal bg-primary p-10 text-primary-content">
		<aside>
			<LucideCloudUpload class="size-24 text-[#DE1A58]" />
			<p class="font-bold">ZNL-DRIVE</p>
			<p>Copyright © {new Date().getFullYear()} - All right reserved</p>
		</aside>
		<nav>
			<div class="grid grid-flow-col gap-10">
				<a href="https://github.com/zarnihlawn/znl-drive">
					<SiGithub class="size-10" />
				</a>
				<a href="https://zarnihlawn-website.fly.dev/">
					<LucideCircleUser class="size-10" />
				</a>
			</div>
		</nav>
	</footer>
</div>
