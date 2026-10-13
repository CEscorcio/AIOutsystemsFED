import type { GreetingCardConfig, GreetingCardEvents, GreetingCardParameters } from "./types";
import { ensureStyles } from "./styles";

export class GreetingCard {
  private readonly mount: HTMLElement;
  private readonly events: GreetingCardEvents;
  private readonly root: HTMLElement;
  private readonly title: HTMLElement;
  private readonly countLabel: HTMLElement;
  private readonly button: HTMLButtonElement;
  private count = 0;
  private destroyed = false;

  constructor(config: GreetingCardConfig) {
    const mount = document.getElementById(config.runtimeId);
    if (!mount) {
      throw new Error(`GreetingCard: mount element "${config.runtimeId}" not found`);
    }
    this.mount = mount;
    this.events = config.events || {};

    ensureStyles(document);

    this.root = document.createElement("div");
    this.root.className = "card greeting-card__body";

    const text = document.createElement("div");
    text.className = "greeting-card__text";
    this.title = document.createElement("p");
    this.title.className = "greeting-card__title";
    this.countLabel = document.createElement("span");
    this.countLabel.className = "greeting-card__count";
    text.append(this.title, this.countLabel);

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "btn btn-primary greeting-card__button";
    this.button.addEventListener("click", this.handleClick);

    this.root.append(text, this.button);
    this.mount.replaceChildren(this.root);

    this.applyParameters(config);
    this.renderCount();
  }

  /** Called from the Block's OnParametersChanged handler. */
  onParametersChanged(params: Partial<GreetingCardParameters>): void {
    if (this.destroyed) return;
    this.applyParameters(params);
  }

  /** Called from the Block's OnDestroy handler. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.button.removeEventListener("click", this.handleClick);
    this.root.remove();
  }

  private readonly handleClick = (): void => {
    this.count += 1;
    this.renderCount();
    if (this.events.OnGreetClicked) this.events.OnGreetClicked(this.count);
  };

  // Platform data enters the DOM through textContent only, never innerHTML.
  private applyParameters(params: Partial<GreetingCardParameters>): void {
    if (params.name !== undefined) this.title.textContent = `Hello, ${params.name || "there"}!`;
    if (params.buttonLabel !== undefined) this.button.textContent = params.buttonLabel || "Greet";
  }

  private renderCount(): void {
    this.countLabel.textContent =
      this.count === 1 ? "Greeted 1 time" : `Greeted ${this.count} times`;
  }
}
