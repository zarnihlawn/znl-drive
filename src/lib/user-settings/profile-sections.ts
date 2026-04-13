export type ProfileSectionId = 'about' | 'developer';

export type ProfileSectionDef = {
	id: ProfileSectionId;
	title: string;
	searchBlob: string;
};

export const PROFILE_SECTIONS: readonly ProfileSectionDef[] = [
	{
		id: 'about',
		title: 'About',
		searchBlob:
			'about app product znl drive znl-drive version release account email profile signed in user identity'
	},
	{
		id: 'developer',
		title: 'Developer',
		searchBlob:
			'developer development debug technical stack build mode environment tooling api rest http bearer authorization x-api-key api key app password revoke'
	}
];
