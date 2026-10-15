import { GreetingCard } from "./greeting-card/GreetingCard";

// Registers window.ClaudeTest.GreetingCard for the Block's JS nodes.
type Namespace = { GreetingCard?: typeof GreetingCard };
const w = window as unknown as { ClaudeTest?: Namespace };
w.ClaudeTest = w.ClaudeTest || {};
w.ClaudeTest.GreetingCard = GreetingCard;
