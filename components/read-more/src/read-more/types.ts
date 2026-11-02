// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> ReadMoreParameters
//   Text       Text, mandatory       the text; line breaks are kept
//   Lines      Integer, default 3    lines shown while collapsed (<= 0 uses 3)
//   MoreLabel  Text, default "Show more"
//   LessLabel  Text, default "Show less"
//   ExtendedClass  Text, not mandatory, default "" (every Block has one).
//                  Applied by the Block's main container, never by this class.
//                  Modifiers it accepts (BEM, see style/read-more.scss):
//                    read-more--muted   secondary colour, smaller
//
// Block Events -> ReadMoreEvents (each wired through a bridge Client Action,
// because $actions in a JS node resolves Client Actions only)
//   OnToggled(IsExpanded: Boolean)  <- Client Action TriggerToggled(IsExpanded)

export interface ReadMoreParameters {
	text: string;
	lines: number;
	moreLabel: string;
	lessLabel: string;
}

export interface ReadMoreEvents {
	OnToggled?: (isExpanded: boolean) => void;
}

export interface ReadMoreConfig extends Partial<ReadMoreParameters> {
	/** Runtime id of the Block's empty mount Container. */
	runtimeId: string;
	events?: ReadMoreEvents;
}
