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
