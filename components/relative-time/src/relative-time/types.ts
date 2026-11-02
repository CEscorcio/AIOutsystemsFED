// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> RelativeTimeParameters
//   Timestamp   Text, mandatory     ISO 8601, e.g. 2026-10-22T10:00:00Z
//   Locale      Text, default ""    BCP 47 tag; empty uses the browser's language
//   EmptyLabel  Text, default ""    shown when Timestamp is empty or invalid
//   Live        Boolean, default True  refresh every 30 seconds
//   ExtendedClass  Text, not mandatory, default "" (every Block has one).
//                  Applied by the Block's main container, never by this class.
//                  Modifiers it accepts (BEM, see style/relative-time.scss):
//                    relative-time--muted   secondary colour, smaller
//
// No Block Events.

export interface RelativeTimeParameters {
	timestamp: string;
	locale: string;
	emptyLabel: string;
	live: boolean;
}

export interface RelativeTimeConfig extends Partial<RelativeTimeParameters> {
	/** Runtime id of the Block's empty mount Container. */
	runtimeId: string;
	/** The current time, in ms. Tests pass a fixed clock; the Block never sets it. */
	now?: () => number;
}
