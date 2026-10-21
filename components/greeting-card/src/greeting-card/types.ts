// The contract with the OutSystems Block, in TypeScript. component.json
// describes the same Block as data (the generators in platform/o11/ build
// the Block from it); npm test fails when the two disagree.
//
// Block Input Parameters -> GreetingCardParameters
//   Name           Text
//   ButtonLabel    Text
//   ExtendedClass  Text, not mandatory, default "" (every pattern has one).
//                  Applied by the Block, NOT by this class: the Block's main
//                  container has Style Classes =
//                  "greeting-card" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")
//                  so it is deliberately absent from GreetingCardParameters.
//                  Modifiers it accepts (BEM, see style/greeting-card.scss):
//                    greeting-card--compact   tighter padding, smaller title
//
// Block Events -> GreetingCardEvents (each wired through a bridge Client Action,
// because $actions in a JS node resolves Client Actions only)
//   OnGreetClicked(Count: Integer)  <- Client Action TriggerGreetClicked(Count)

export interface GreetingCardParameters {
	name: string;
	buttonLabel: string;
}

export interface GreetingCardEvents {
	OnGreetClicked?: (count: number) => void;
}

export interface GreetingCardConfig extends GreetingCardParameters {
	/** Runtime id of the Block's empty mount Container. */
	runtimeId: string;
	events?: GreetingCardEvents;
}
