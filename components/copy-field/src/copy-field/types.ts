// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> CopyFieldParameters
//   Value        Text, mandatory   the text shown and copied
//   Label        Text, default ""  a label above the value; empty shows none
//   CopyLabel    Text, default "Copy"
//   CopiedLabel  Text, default "Copied"; shown for two seconds and announced
//   ExtendedClass  Text, not mandatory, default "" (every Block has one).
//                  Applied by the Block's main container, never by this class.
//                  Modifiers it accepts (BEM, see style/copy-field.scss):
//                    copy-field--compact   smaller text and padding
//
// Block Events -> CopyFieldEvents (each wired through a bridge Client Action,
// because $actions in a JS node resolves Client Actions only)
//   OnCopied(Value: Text)  <- Client Action TriggerCopied(Value)

export interface CopyFieldParameters {
	value: string;
	label: string;
	copyLabel: string;
	copiedLabel: string;
}

export interface CopyFieldEvents {
	OnCopied?: (value: string) => void;
}

export interface CopyFieldConfig extends Partial<CopyFieldParameters> {
	/** Runtime id of the Block's empty mount Container. */
	runtimeId: string;
	events?: CopyFieldEvents;
}
