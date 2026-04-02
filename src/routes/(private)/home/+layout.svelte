<script lang="ts">
	import { resolve } from '$app/paths';
	import { getUserInitials } from '$lib/tool/user-initials';

	let { data, children } = $props();

	const initials = $derived(getUserInitials(data.user));
</script>

<div class="my-app">
	<div class="d-navbar bg-base-100 shadow-sm">
		<div class="flex-1">
			<a class="d-btn d-btn-ghost text-xl" href={resolve('/home')}>ZNL-DRIVE</a>
      
		</div>
		<div class="flex gap-5">
			<input type="text" placeholder="Search" class="d-input d-input-bordered w-24 md:w-auto" />
			<div class="d-dropdown d-dropdown-end">
				<div tabindex="0" role="button" class="d-btn d-btn-ghost d-btn-circle d-avatar">
						<div
							class="ring-primary ring-offset-base-100 flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-offset-2"
						>
							<span class="text-lg font-bold select-none">{initials}</span>
						</div>
				</div>
				<ul
					tabindex="-1"
					class="d-menu d-menu-sm d-dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
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
  <aside>

  </aside>
    {@render children?.()}
  </main>
</div>
