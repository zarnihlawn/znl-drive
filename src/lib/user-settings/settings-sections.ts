export type SettingsSectionId = 'appearance' | 'language' | 'general';

export type SettingsSectionDef = {
	id: SettingsSectionId;
	title: string;
	/** Lowercased blob for search (labels + related keywords). */
	searchBlob: string;
};

export const SETTINGS_SECTIONS: readonly SettingsSectionDef[] = [
	{
		id: 'appearance',
		title: 'Appearance',
		searchBlob:
			'appearance theme color scheme daisyui dark light mode font typography text size scale readability display contrast'
	},
	{
		id: 'language',
		title: 'Language',
		searchBlob:
			'language locale translation internationalization i18n english en myanmar burmese my japanese ja korean ko'
	},
	{
		id: 'general',
		title: 'General',
		searchBlob:
			'general account preferences notifications storage defaults profile workspace about'
	}
];
