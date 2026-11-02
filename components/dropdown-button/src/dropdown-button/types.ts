// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> DropdownButtonParameters
//   Label       Text, mandatory          the action button's text
//   Variant     Text, default "Primary"  Primary | Secondary | Tertiary | Transparent
//   Size        Text, default "Medium"   Medium | Small | ExtraSmall
//   Enabled     Boolean, default True    False disables both parts, closes the menu
//   Url         Text, default ""         set: the action is a link; empty: it raises OnClick
//   Icon        Text, default ""         a Font Awesome 4 icon name for a leading icon
//   MenuLabel   Text, default "More options"  the chevron's accessible name
//   ExtendedClass   Text, not mandatory, default "" (every Block has one).
//                   Applied by the Block's main container, never by this class.
//                   Modifiers it accepts (BEM, see style/dropdown-button.scss):
//                     dropdown-button--menu-end   the menu aligns to the end edge
//
// Block Placeholder -> DropdownButtonConfig.menuId
//   Menu   in the container MenuContainer (class dropdown-button__menu) inside the
//          mount; the screen puts Links in it. This class only shows and hides
//          that container; OutSystems renders and owns what's in it.
//
// Block Events -> DropdownButtonEvents (each wired through a bridge Client Action,
// because $actions in a JS node resolves Client Actions only)
//   OnClick()  <- Client Action TriggerClick()

export type DropdownButtonVariant = 'Primary' | 'Secondary' | 'Tertiary' | 'Transparent';
export type DropdownButtonSize = 'Medium' | 'Small' | 'ExtraSmall';

export interface DropdownButtonParameters {
	label: string;
	variant: string;
	size: string;
	enabled: boolean;
	url: string;
	icon: string;
	menuLabel: string;
}

export interface DropdownButtonEvents {
	OnClick?: () => void;
}

export interface DropdownButtonConfig extends Partial<DropdownButtonParameters> {
	/** Runtime id of the Block's mount Container (MountPoint). */
	runtimeId: string;
	/** Runtime id of the container around the Menu placeholder (MenuContainer.Id). */
	menuId?: string;
	events?: DropdownButtonEvents;
}
