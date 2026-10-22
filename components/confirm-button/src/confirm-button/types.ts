// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> ConfirmButtonParameters
//   Label           Text, mandatory   the text before it's armed
//   ConfirmLabel    Text, default "Click again to confirm"; announced when armed
//   TimeoutSeconds  Integer, default 4   how long it stays armed (<= 0 uses 4)
//   IsDisabled      Boolean, default False  disables and disarms it
//   ExtendedClass   Text, not mandatory, default "" (every Block has one).
//                   Applied by the Block's main container, never by this class.
//                   Modifiers it accepts (BEM, see style/confirm-button.scss):
//                     confirm-button--full-width   fills its container's width
//
// Block Events -> ConfirmButtonEvents (each wired through a bridge Client Action,
// because $actions in a JS node resolves Client Actions only)
//   OnConfirmed()  <- Client Action TriggerConfirmed()

export interface ConfirmButtonParameters {
	label: string;
	confirmLabel: string;
	timeoutSeconds: number;
	isDisabled: boolean;
}

export interface ConfirmButtonEvents {
	OnConfirmed?: () => void;
}

export interface ConfirmButtonConfig extends Partial<ConfirmButtonParameters> {
	/** Runtime id of the Block's empty mount Container. */
	runtimeId: string;
	events?: ConfirmButtonEvents;
}
