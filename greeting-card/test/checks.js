// Scripted click-through of the component. Runs in the preview page
// (preview/index.html?test=1) and under jsdom (npm test). No publish needed.
// eslint-disable-next-line no-unused-vars
function runGreetingCardChecks(win) {
  var doc = win.document;
  var results = [];
  function check(name, ok) { results.push({ name: name, ok: !!ok }); }

  var GreetingCard = win.ClaudeTest && win.ClaudeTest.GreetingCard;
  check("bundle registers window.ClaudeTest.GreetingCard", typeof GreetingCard === "function");
  if (typeof GreetingCard !== "function") return results;

  var host = doc.createElement("div");
  host.id = "gc-test-mount";
  doc.body.appendChild(host);

  var clicks = [];
  var card = new GreetingCard({
    runtimeId: "gc-test-mount",
    name: "Ada",
    buttonLabel: "Say hi",
    events: { OnGreetClicked: function (n) { clicks.push(n); } }
  });

  var title = host.querySelector(".greeting-card__title");
  var button = host.querySelector("button");
  var count = host.querySelector(".greeting-card__count");

  check("renders inside the mount container", host.querySelector(".greeting-card__body") !== null);
  check("uses OutSystems UI card and button classes",
    host.querySelector(".card") !== null && button && button.classList.contains("btn-primary"));
  // Golden rule: every class the component renders is either an OutSystems UI
  // class or BEM under the pattern block (greeting-card__element, --modifier).
  var OSUI_CLASSES = ["card", "btn", "btn-primary"];
  var BEM = /^greeting-card(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$/;
  var offenders = [];
  Array.prototype.forEach.call(host.querySelectorAll("[class]"), function (el) {
    Array.prototype.forEach.call(el.classList, function (c) {
      if (OSUI_CLASSES.indexOf(c) === -1 && !BEM.test(c)) offenders.push(c);
    });
  });
  check("every component class is BEM or OutSystems UI" + (offenders.length ? " (" + offenders.join(", ") + ")" : ""),
    offenders.length === 0);
  check("button carries its BEM element class", button && button.classList.contains("greeting-card__button"));

  check("shows the name", title && title.textContent === "Hello, Ada!");
  check("shows the button label", button && button.textContent === "Say hi");
  check("starts at zero greetings", count && count.textContent === "Greeted 0 times");

  button.click();
  check("click fires OnGreetClicked with count 1", clicks.length === 1 && clicks[0] === 1);
  check("click updates the count (singular)", count.textContent === "Greeted 1 time");
  button.click();
  check("second click fires with count 2", clicks[1] === 2 && count.textContent === "Greeted 2 times");

  card.onParametersChanged({ name: "Grace" });
  check("onParametersChanged updates the name", title.textContent === "Hello, Grace!");
  check("onParametersChanged keeps the button label", button.textContent === "Say hi");
  check("onParametersChanged keeps the count", count.textContent === "Greeted 2 times");

  card.onParametersChanged({ name: "", buttonLabel: "" });
  check("empty name and label fall back", title.textContent === "Hello, there!" && button.textContent === "Greet");

  card.onParametersChanged({ name: "<img src=x onerror=alert(1)>" });
  check("markup in data renders as text, not HTML",
    host.querySelector("img") === null && title.textContent.indexOf("<img") !== -1);

  check("styles injected into <head> once", doc.querySelectorAll("#greeting-card-styles").length === 1);

  // Style.md: every OutSystems UI variable is used with a fallback equal to its
  // value in the base theme, and no raw colour appears outside such a fallback.
  // Values copied from OutSystems UI 2.30.0's :root.
  var OSUI_TOKENS = {
    "--color-primary": "#1068eb", "--color-primary-selected": "rgba(20, 110, 245, .12)",
    "--color-neutral-0": "#ffffff", "--color-neutral-4": "#dee2e6", "--color-neutral-5": "#ced4da",
    "--color-neutral-9": "#272b30",
    "--space-none": "0", "--space-xs": "4px", "--space-s": "8px", "--space-base": "16px", "--space-m": "24px",
    "--border-radius-soft": "4px", "--border-radius-rounded": "100px",
    "--border-size-s": "1px", "--border-size-l": "3px",
    "--shadow-xs": "0 1px 2px rgba(0, 0, 0, .1)", "--shadow-s": "0 2px 4px rgba(0, 0, 0, .1)",
    "--font-size-h5": "20px", "--font-size-base": "16px", "--font-size-xs": "12px", "--font-semi-bold": "600"
  };
  var css = (doc.getElementById("greeting-card-styles") || {}).textContent || "";
  var VAR_WITH_FALLBACK = /var\((--[a-z0-9-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g;
  var tokenProblems = [];
  var m;
  while ((m = VAR_WITH_FALLBACK.exec(css)) !== null) {
    if (!(m[1] in OSUI_TOKENS)) tokenProblems.push(m[1] + " is not a known OutSystems UI token");
    else if (m[2] === undefined) tokenProblems.push(m[1] + " has no fallback");
    else if (m[2].trim() !== OSUI_TOKENS[m[1]]) tokenProblems.push(m[1] + " fallback " + m[2].trim() + " != " + OSUI_TOKENS[m[1]]);
  }
  check("every variable is an OutSystems UI token with its base-theme fallback" +
    (tokenProblems.length ? " (" + tokenProblems.join("; ") + ")" : ""), tokenProblems.length === 0);
  var rawColours = css.replace(VAR_WITH_FALLBACK, "").match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g);
  check("no raw colour outside a variable fallback" + (rawColours ? " (" + rawColours.join(", ") + ")" : ""), !rawColours);
  check("no !important", css.indexOf("!important") === -1);

  // Style.md Rule 3: a selector is one BEM class of this block, optionally
  // prefixed by a modifier/state of the block or one OutSystems UI context class.
  var BLOCK = "greeting-card";
  var OSUI_CONTEXT = [".desktop", ".tablet", ".phone", ".landscape", ".portrait", ".is-rtl",
    ".has-accessible-features", ".os-high-contrast"];
  var badSelectors = [];
  var cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  var RULE = /([^{}]+)\{[^{}]*\}/g;
  var r;
  while ((r = RULE.exec(cssNoComments)) !== null) {
    r[1].split(",").forEach(function (raw) {
      var sel = raw.trim();
      if (!sel || sel.charAt(0) === "@") return;
      var parts = sel.replace(/::?[a-z-]+(\([^)]*\))?/g, "").trim().split(/\s+/);
      var last = parts[parts.length - 1];
      var prefix = parts.length === 2 ? parts[0] : null;
      var ok = parts.length <= 2 &&
        /^\.[a-z0-9_-]+$/.test(last) && BEM.test(last.slice(1)) &&
        (prefix === null || OSUI_CONTEXT.indexOf(prefix) !== -1 ||
          (/^\.[a-z0-9_-]+$/.test(prefix) && BEM.test(prefix.slice(1)) && prefix.indexOf("--") !== -1));
      if (!ok) badSelectors.push(sel);
    });
  }
  check("every selector is one BEM class, prefixed at most by a modifier or OutSystems UI context class" +
    (badSelectors.length ? " (" + badSelectors.join(" | ") + ")" : ""), badSelectors.length === 0);

  // Style.md Rule 5: direction through logical properties only.
  var physical = cssNoComments.match(/(^|[\s;{])(left|right|(margin|padding|border)-(left|right)[a-z-]*)\s*:|text-align\s*:\s*(left|right)/g);
  check("no left/right properties (use logical properties)" + (physical ? " (" + physical.join(", ").replace(/[\s;{]/g, "") + ")" : ""), !physical);

  // Style.md Rule 6: focus belongs to OutSystems UI; motion has a reduced-motion override.
  check("no focus styles and no outline removal",
    !/:focus/.test(cssNoComments) && !/outline\s*:\s*(none|0)\b/.test(cssNoComments));
  check("transitions and animations have a prefers-reduced-motion override",
    !/(transition|animation)\s*:/.test(cssNoComments) || cssNoComments.indexOf("prefers-reduced-motion") !== -1);

  // Style.md Rule 4: widths switch on OutSystems UI device classes, not media queries.
  check("no width media queries (use .phone / .tablet)", !/@media[^{]*(min|max)-width/.test(cssNoComments));

  // ExtendedClass is applied by the Block on its main container (the mount),
  // via Style Classes. The class must leave the container's classes alone and
  // never apply ExtendedClass itself, or every class would be applied twice.
  var host2 = doc.createElement("div");
  host2.id = "gc-test-mount-2";
  host2.className = "greeting-card my-theme";
  doc.body.appendChild(host2);
  var card2 = new GreetingCard({ runtimeId: "gc-test-mount-2", name: "B", buttonLabel: "B" });
  check("second instance does not duplicate styles", doc.querySelectorAll("#greeting-card-styles").length === 1);
  check("container classes (pattern class + ExtendedClass) are untouched on create",
    host2.className === "greeting-card my-theme");
  card2.onParametersChanged({ name: "C", buttonLabel: "C" });
  check("container classes are untouched on update", host2.className === "greeting-card my-theme");
  check("ExtendedClass is not duplicated on the card root",
    host2.querySelector(".greeting-card__body").className === "card greeting-card__body");
  card2.destroy();
  check("container classes are untouched on destroy", host2.className === "greeting-card my-theme");

  card.destroy();
  check("destroy removes the component", host.querySelector(".greeting-card__body") === null);
  button.click();
  check("destroy removes the click listener", clicks.length === 2);
  var threw = false;
  try { card.onParametersChanged({ name: "late" }); card.destroy(); } catch (e) { threw = true; }
  check("calls after destroy are safe", !threw);

  var missing = false;
  try { new GreetingCard({ runtimeId: "does-not-exist", name: "", buttonLabel: "" }); } catch (e) { missing = true; }
  check("missing mount id throws a clear error", missing);

  host.remove();
  host2.remove();
  return results;
}

if (typeof module !== "undefined") module.exports = runGreetingCardChecks;
