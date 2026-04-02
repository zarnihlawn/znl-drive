<script lang="ts">
	import { resolve } from '$app/paths';
	import { getUserInitials } from '$lib/tool/user-initials';

	let { data, children } = $props();

	const initials = $derived(getUserInitials(data.user));
</script>

<div class="my-app">
	<div class="d-navbar bg-base-100 shadow-sm">
		<div class="flex-1">
			<a class="d-btn text-xl d-btn-ghost" href={resolve('/home')}>ZNL-DRIVE</a>
		</div>
		<div class="flex gap-5">
			<input type="text" placeholder="Search" class="d-input-bordered d-input w-24 md:w-auto" />
			<div class="d-dropdown d-dropdown-end">
				<div tabindex="0" role="button" class="d-btn d-avatar d-btn-circle d-btn-ghost">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100"
					>
						<span class="text-lg font-bold select-none">{initials}</span>
					</div>
				</div>
				<ul
					tabindex="-1"
					class="d-dropdown-content d-menu z-1 mt-3 w-52 d-menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li>
						<a class="justify-between" href={resolve('/home')}>
							Profile
							<span class="d-badge">New</span>
						</a>
					</li>
					<li><a href={resolve('/home')}>Settings</a></li>
					<li>
						<form method="POST" action={resolve(`/api/auth/logout`)}>
							<button type="submit" class="w-full text-left">Logout</button>
						</form>
					</li>
				</ul>
			</div>
		</div>
	</div>
	<main class="my-main">
		<aside></aside>
		{@render children?.()}
	</main>
</div>
