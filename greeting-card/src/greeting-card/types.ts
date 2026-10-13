// The contract with the OutSystems Block. When the Block and the class
// disagree, this file is the arbiter.
//
// Block Input Parameters -> GreetingCardParameters
//   Name           Text
//   ButtonLabel    Text
//   ExtendedClass  Text, not mandatory, default "" (every pattern has one:
//                  extra CSS classes added to the component's root element)
//
// Block Events -> GreetingCardEvents (each wired through a bridge Client Action,
// because $actions in an ODC JS node resolves Client Actions only)
//   OnGreetClicked(Count: Integer)  <- Client Action TriggerGreetClicked(Count)

export interface GreetingCardParameters {
  name: string;
  buttonLabel: string;
  extendedClass?: string;
}

export interface GreetingCardEvents {
  OnGreetClicked?: (count: number) => void;
}

export interface GreetingCardConfig extends GreetingCardParameters {
  /** Runtime id of the Block's empty mount Container. */
  runtimeId: string;
  events?: GreetingCardEvents;
}
