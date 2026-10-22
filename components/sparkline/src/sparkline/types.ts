// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> SparklineParameters
//   Values    Text, mandatory     numbers separated by commas, semicolons or spaces
//   Label     Text, default ""    what the line shows, for screen readers
//   ShowLast  Boolean, default True  a dot on the last point
//   ExtendedClass  Text, not mandatory, default "" (every Block has one).
//                  Applied by the Block's main container, never by this class.
//                  Modifiers it accepts (BEM, see style/sparkline.scss):
//                    sparkline--positive   the line in the success colour
//                    sparkline--negative   the line in the error colour
//
// No Block Events.

export interface SparklineParameters {
	values: string;
	label: string;
	showLast: boolean;
}

export interface SparklineConfig extends Partial<SparklineParameters> {
	/** Runtime id of the Block's empty mount Container. */
	runtimeId: string;
}
