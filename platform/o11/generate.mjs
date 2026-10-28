// Generates the Model API lambdas that put a release and its components into an
// OutSystems 11 Reactive module through the Service Studio MCP
// (docs/guide/Components_11.md). Nothing here talks to OutSystems: it writes C# files
// for the agent to pass to applyModelApiCode, so no AI model retypes the
// Script, the CSS or the Block.
//
// Usage (from the repo root, after npm run build:all):
//   node platform/o11/generate.mjs script [--name <Script>]
//   node platform/o11/generate.mjs theme [--theme <Theme>]
//   node platform/o11/generate.mjs block <component> [--name <Block>] [--flow <Flow>] [--public]
//   node platform/o11/generate.mjs harness <component> [--screen <Class>Test] [--flow <Flow>] [--block <Block>] [--block-flow <Flow>]
//   node platform/o11/generate.mjs showcase <component> [--screen <Screen>] [--block <Block>]
//   any of script, theme, block, showcase with --traditional: for a Traditional Web module,
//   with the names in factory.config.json's "traditional" section
//
// Script, theme, flows, layout and harness role default to factory.config.json ("o11"):
// Blocks go in o11.blockFlow, harness screens in o11.flow.
// <component> is a folder in components/, or in templates/ for a dry run.
//
// Each command writes to platform/o11/out/ (not committed):
//   <what>.cs           the lambda to apply (create, or for script/theme create or replace)
//   <what>.probe.cs     the dry run or read-back check; it throws PROBE:<values>
//   and prints the values that probe must report. For script, block and
//   harness the probe is the same edit ending in a throw, so it saves nothing.
//   For theme, the stylesheet only reads back after a save, so its probe is a
//   read-back to run after applying <what>.cs, before merging.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../../scripts/lib/config.mjs';
import { bridgeAction, camel, componentsDir, kebab, loadContract, root, templatesDir, TYPES } from '../../scripts/lib/contract.mjs';

// Names default to factory.config.json ("o11"); the options override them.
const config = loadConfig();
const SCRIPT = config.o11.script;

const outDir = join(import.meta.dirname, 'out');
const [command, target] = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] || '').startsWith('--'));
const option = (name, fallback) => {
	const i = process.argv.indexOf(`--${name}`);
	return i === -1 ? fallback : process.argv[i + 1];
};
const flag = (name) => process.argv.includes(`--${name}`);

function fail(message) {
	console.error(`generate: ${message}`);
	process.exit(1);
}

// C# verbatim string literal: newlines kept, quotes doubled.
const cs = (text) => `@"${String(text).replace(/"/g, '""')}"`;
// The same checksum the probes compute in C#: h = h * 31 + c over UTF-16 code units, 32-bit.
const checksum = (text) => {
	let h = 0;
	for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
	return h;
};
const CHECKSUM_CS = (v) => `int h = 0; foreach (char c in ${v}) h = unchecked(h * 31 + c);`;

function readDist(file) {
	const path = join(root, 'dist', file);
	if (!existsSync(path)) fail(`dist/${file} is missing; run npm run build:all first`);
	const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
	const version = text.match(/^ \* Version: (\S+)$/m);
	const built = text.match(/^ \* Built: (\S+)$/m);
	if (!version || !built) fail(`dist/${file} has no version header; run npm run build:all`);
	return { text, version: version[1], built: built[1] };
}

function write(name, apply, probe, expected) {
	mkdirSync(outDir, { recursive: true });
	for (const [file, code] of [
		[`${name}.cs`, apply],
		[`${name}.probe.cs`, probe],
	]) {
		if (!code.trimEnd().endsWith('}')) fail(`internal: ${file} must end with "}"`);
		writeFileSync(join(outDir, file), code.trimEnd());
	}
	console.log(`Wrote platform/o11/out/${name}.cs and ${name}.probe.cs`);
	console.log(`The probe must report: PROBE:${expected}`);
}

// A component, or a template (for a dry run of the generators themselves).
function contractOf(folder) {
	if (!folder) fail(`name a component, e.g. status-badge`);
	const dir = existsSync(join(componentsDir, folder, 'component.json')) ? componentsDir : templatesDir;
	const { contract, errors } = loadContract(folder, dir);
	if (!contract) fail(errors.join('\n'));
	if (errors.length) fail(`fix component.json first:\n  ${errors.join('\n  ')}`);
	return contract;
}

// ---- Traditional Web (--traditional): the same release in a Traditional module ----
// Measured 2026-10-28 in a Traditional style-guide module (Components_11.md, Traditional Web):
// - Traditional Web Blocks have no Required Scripts: the bundle is the JavaScript of one
//   Web Block (traditional.scriptBlock), and each component Block contains an instance of it.
// - A Web Block has no lifecycle events, and its On Render JavaScript can't reference
//   widgets; the class is started by an Expression widget (Escape Content off) that
//   writes a <script> with the widgets' ids, on every render (Ajax refreshes included).
// - A container's Style Classes is static text; the mount's classes are an extended
//   property "class" (block class + ExtendedClass).
// - Each event is a hidden Link (in <block>__bridge) whose On Click raises the Block
//   event by Ajax; the class's callback clicks it. Events with parameters aren't supported.
const TRADITIONAL = flag('traditional');
const WEB = 'OutSystems.Model.UI.Web';
function traditionalConfig() {
	if (!config.traditional) fail('factory.config.json has no "traditional" section; add one to generate for a Traditional Web module');
	return config.traditional;
}
const webBlocks = `eSpace.WebFlows.SelectMany(f => f.Nodes).OfType<${WEB}.IWebBlock>()`;

function scriptTraditional() {
	const t = traditionalConfig();
	const name = option('name', t.scriptBlock);
	const js = readDist('components.js');
	const body = (tail) => `eSpace => {
	var flow = eSpace.WebFlows.FirstOrDefault(f => f.Name == ${cs(t.blockFlow)}) ?? eSpace.CreateWebFlow(${cs(t.blockFlow)});
	var s = ${webBlocks}.FirstOrDefault(b => b.Name == ${cs(name)}) ?? flow.CreateBlock(${cs(name)});
	s.Description = ${cs(`AIOutsystemsFED components: dist/components.js ${js.version}, built ${js.built}, as this Web Block's JavaScript. Every component Block contains an instance of this Block, which loads it. Generated from the repo; don't edit here, rebuild and replace.`)};
	s.Public = false;
	s.JavaScript = ${cs(js.text)};${tail}
}`;
	const probe = `
	var j = s.JavaScript; ${CHECKSUM_CS('j')}
	throw new Exception("PROBE:block=" + s.Name + " len=" + j.Length + " hash=" + h);`;
	write('script-traditional', body(''), body(probe), `block=${name} len=${js.text.length} hash=${checksum(js.text)}`);
}

// The <script> an Expression widget writes on every render: waits for the bundle, then
// starts the class on the mount with the Block's inputs, ids and event links.
function initExpression(c) {
	// JS parts use single quotes only, so as OutSystems text literals they need no escaping.
	const parts = [];
	const js = (text) => {
		const last = parts[parts.length - 1];
		if (last && last.text !== undefined) last.text += text;
		else parts.push({ text });
	};
	const val = (expr) => parts.push({ expr });
	js(
		`<script>(function start(n) { var ns = window.${config.namespace}; if (!ns || !ns.${c.class}) { if (n < 100) setTimeout(function () { start(n + 1); }, 50); return; } new ns.${c.class}({ runtimeId: '`,
	);
	val('MountPoint.Id');
	js("'");
	for (const p of c.placeholders) {
		js(`, ${camel(p.name)}Id: '`);
		val(`${p.name}Container.Id`);
		js("'");
	}
	for (const p of c.inputs) {
		if (p.type === 'Text') {
			js(`, ${camel(p.name)}: '`);
			val(`EncodeJavaScript(${p.name})`);
			js("'");
		} else if (p.type === 'Boolean') {
			js(`, ${camel(p.name)}: `);
			val(`If(${p.name}, "true", "false")`);
		} else {
			js(`, ${camel(p.name)}: `);
			val(p.name);
		}
	}
	if (c.events.length) {
		js(', events: { ');
		c.events.forEach((e, i) => {
			js(`${i ? ', ' : ''}${e.name}: function () { var l = document.getElementById('`);
			val(`${e.name}Link.Id`);
			js("'); if (l) l.click(); }");
		});
		js(' }');
	}
	js(' }); })(0);</script>');
	if (parts.some((p) => p.text !== undefined && /["\\]/.test(p.text))) fail('internal: the init script must not contain double quotes or backslashes');
	return parts.map((p) => (p.text !== undefined ? `"${p.text}"` : p.expr)).join(' + ');
}

function blockTraditional() {
	const t = traditionalConfig();
	const c = contractOf(target);
	const blockName = option('name', c.class);
	const flowName = option('flow', t.blockFlow);
	const ns = `${config.namespace}.${c.class}`;
	for (const e of c.events) if ((e.params || []).length) fail(`${c.class}.${e.name} has parameters; the Traditional Block raises events through a Link, which can't pass them yet`);
	const modifiers = c.modifiers.length ? ` Modifiers: ${c.modifiers.map((m) => `${m.class} (${m.description})`).join('; ')}.` : '';
	const L = [];
	const add = (line) => L.push(`\t${line}`);
	add(`var flow = eSpace.WebFlows.FirstOrDefault(f => f.Name == ${cs(flowName)}) ?? eSpace.CreateWebFlow(${cs(flowName)});`);
	add(`if (${webBlocks}.Any(b => b.Name == ${cs(blockName)})) throw new Exception("PROBE:a Web Block named ${blockName} already exists; this generator only creates Blocks");`);
	add(`var scriptBlock = ${webBlocks}.FirstOrDefault(b => b.Name == ${cs(t.scriptBlock)});`);
	add(`if (scriptBlock == null) throw new Exception("PROBE:no Web Block named ${t.scriptBlock}; apply script-traditional.cs first");`);
	add(`var block = flow.CreateBlock(${cs(blockName)});`);
	add(
		`block.Description = ${cs(`${c.description} Bridge to window.${ns} (the JavaScript of Web Block ${t.scriptBlock}). Generated from ${c.dir === templatesDir ? 'templates' : 'components'}/${c.folder}/component.json.`)};`,
	);
	add(`block.Public = ${flag('public') ? 'true' : 'false'};`);
	c.inputs.forEach((p, i) => {
		add(
			`var in${i} = block.CreateInputParameter(${cs(p.name)}); in${i}.DataType = ${TYPES[p.type].modelApi}; in${i}.IsMandatory = ${p.mandatory}; in${i}.SetDefaultValue(${cs(p.default)}); in${i}.Description = ${cs(p.description)};`,
		);
	});
	add(`var inExt = block.CreateInputParameter("ExtendedClass"); inExt.DataType = eSpace.TextType; inExt.IsMandatory = false; inExt.SetDefaultValue(${cs('""')});`);
	add(`inExt.Description = ${cs(`Extra classes for the main container (MountPoint). Applied by the Block, never passed to the class.${modifiers}`)};`);
	c.events.forEach((e, i) => add(`var ev${i} = block.CreateEvent(${cs(e.name)}); ev${i}.IsMandatory = false; ev${i}.Description = ${cs(e.description)};`));
	add(`var mount = block.CreateWidget<${WEB}.Widgets.IContainerWidget>("MountPoint");`);
	add(`mount.EffectiveWidth = OutSystems.Model.Enumerations.EffectiveWidthType.InlineBlock; mount.Width = null;`);
	add(
		`var mountClass = mount.CreateExtendedProperty(); mountClass.Property = "class"; mountClass.SetValue(${cs(`"${c.block}" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")`)});`,
	);
	c.placeholders.forEach((p, i) => {
		add(`var ph${i}c = mount.CreateWidget<${WEB}.Widgets.IContainerWidget>(${cs(`${p.name}Container`)}); ph${i}c.StyleClasses = ${cs(`${c.block}__${kebab(p.name)}`)};`);
		add(`var ph${i} = ph${i}c.CreateWidget<${WEB}.Widgets.IPlaceholderWidget>(${cs(p.name)}); ph${i}.Description = ${cs(p.description)};`);
	});
	if (c.events.length) {
		add(`var bridge = block.CreateWidget<${WEB}.Widgets.IContainerWidget>("Bridge"); bridge.StyleClasses = ${cs(`${c.block}__bridge`)};`);
		c.events.forEach((e, i) => {
			add(
				`var link${i} = bridge.CreateWidget<${WEB}.Widgets.ILinkWidget>(${cs(`${e.name}Link`)}); link${i}.OnClick.Destination = ev${i}; link${i}.OnClick.Method = OutSystems.Model.Enumerations.Method.Ajax;`,
			);
			add(`link${i}.CreateWidget<${WEB}.Widgets.ITextWidget>().Text = ${cs(e.name)};`);
		});
	}
	add(`var scriptInstance = block.CreateWidget<${WEB}.Widgets.IWebBlockInstanceWidget>(); scriptInstance.SourceBlock = scriptBlock;`);
	add(`var init = block.CreateWidget<${WEB}.Widgets.IExpressionWidget>("Init"); init.EscapeContent = false;`);
	add(`init.SetValue(${cs(initExpression(c))});`);
	const summary = `"PROBE:block=" + block.Name + " inputs=" + string.Join(",", block.InputParameters.Select(p => p.Name)) + " events=" + string.Join(",", block.Events.Select(e => e.Name)) + " placeholders=" + string.Join(",", block.GetAllDescendantsOfType<${WEB}.Widgets.IPlaceholderWidget>().Select(p => p.Name)) + " script=" + scriptInstance.SourceBlock.Name`;
	const expected = `block=${blockName} inputs=${[...c.inputs.map((p) => p.name), 'ExtendedClass'].join(',')} events=${c.events.map((e) => e.name).join(',')} placeholders=${c.placeholders.map((p) => p.name).join(',')} script=${t.scriptBlock}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`block-${c.folder}-traditional`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

// A Traditional screen action shows a message through RichWidgets' Feedback_Message.
function feedbackAction(add, v, name, params, message) {
	add(`var ${v} = scr.CreateScreenAction(${cs(name)});`);
	params.forEach((pname, j) => add(`var ${v}p${j} = ${v}.CreateInputParameter(${cs(pname)}); ${v}p${j}.DataType = eSpace.TextType;`));
	add(`var ${v}Start = ${v}.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();`);
	add(`var ${v}Msg = ${v}.CreateNode<OutSystems.Model.Logic.Nodes.IExecuteServerActionNode>().ConnectedBelow(${v}Start); ${v}Msg.Action = feedback;`);
	add(
		`${v}Msg.SetArgumentValue(feedback.InputParameters.First(p => p.Name == "MessageText"), ${cs(message)}); ${v}Msg.SetArgumentValue(feedback.InputParameters.First(p => p.Name == "MessageType"), "Entities.MessageType.Info");`,
	);
	add(`${v}.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(${v}Msg);`);
}

function showcaseTraditional() {
	const t = traditionalConfig();
	const c = contractOf(target);
	if (!c.showcase) fail(`${c.folder}/component.json has no "showcase"`);
	const s = c.showcase;
	const screenName = option('screen', s.screen);
	const blockName = option('block', c.class);
	const flowName = option('flow', t.flow);
	const L = [];
	const add = (line) => L.push(`\t${line}`);
	add(`var flow = eSpace.WebFlows.FirstOrDefault(f => f.Name == ${cs(flowName)});`);
	add(`if (flow == null) throw new Exception("PROBE:no UI flow named ${flowName}");`);
	add(`if (flow.Nodes.OfType<${WEB}.IWebScreen>().Any(x => x.Name == ${cs(screenName)})) throw new Exception("PROBE:a screen named ${screenName} already exists");`);
	add(`var cardBlock = eSpace.WebFlows.Where(f => f.Name == ${cs(t.blockFlow)}).SelectMany(f => f.Nodes).OfType<${WEB}.IWebBlock>().FirstOrDefault(b => b.Name == ${cs(blockName)});`);
	add(`if (cardBlock == null) throw new Exception("PROBE:no Web Block named ${blockName} in ${t.blockFlow}; apply the block lambda first");`);
	add(`var layoutRef = eSpace.References.FirstOrDefault(r => r.Name == ${cs(t.layout.module)});`);
	add(`if (layoutRef == null) throw new Exception("PROBE:no reference to ${t.layout.module}");`);
	add(`var layoutBlk = layoutRef.WebFlows.First(f => f.Name == ${cs(t.layout.flow)}).Nodes.OfType<${WEB}.IWebBlockSignature>().First(b => b.Name == ${cs(t.layout.block)});`);
	add(`var feedback = eSpace.References.First(r => r.Name == "RichWidgets").ServerActions.First(a => a.Name == "Feedback_Message");`);
	add(`var x = flow.Nodes.OfType<${WEB}.IWebScreen>().Select(z => z.HorizontalPosition).DefaultIfEmpty(0).Max() + 1000;`);
	add(`var scr = flow.CreateScreen(${cs(screenName)});`);
	add(`scr.Widgets.ToList().ForEach(w => w.Delete());`);
	add(`scr.Description = ${cs(`Examples of the ${blockName} Web Block, generated from ${c.dir === templatesDir ? 'templates' : 'components'}/${c.folder}/component.json (showcase).`)};`);
	add(`scr.SetTitle(${cs(`"${s.title}"`)});`);
	add(`scr.HorizontalPosition = x; scr.VerticalPosition = 700;`);
	add(`scr.Roles.Add(eSpace.SystemRoles.OfType<OutSystems.Model.Logic.ISystemRole>().First(r => r.Name == ${cs(t.harnessRole)}));`);
	add(`var layout = scr.CreateWidget<${WEB}.Widgets.IWebBlockInstanceWidget>(); layout.SourceBlock = layoutBlk;`);
	Object.entries(t.layoutFill || {}).forEach(([ph, b], i) => {
		add(`var fill${i} = layout.PlaceholdersContent.First(p => p.Placeholder?.Name == ${cs(ph)}).CreateWidget<${WEB}.Widgets.IWebBlockInstanceWidget>();`);
		add(`fill${i}.SourceBlock = ${webBlocks}.First(b => b.Name == ${cs(b)});`);
	});
	add(`layout.PlaceholdersContent.First(p => p.Placeholder?.Name == "Title").CreateWidget<${WEB}.Widgets.ITextWidget>().Text = ${cs(s.title)};`);
	add(`var main = layout.PlaceholdersContent.First(p => p.Placeholder?.Name == "MainContent");`);
	add(`var intro = main.CreateWidget<${WEB}.Widgets.IContainerWidget>("Intro"); intro.StyleClasses = "text-neutral-7 margin-bottom-l";`);
	add(`intro.CreateWidget<${WEB}.Widgets.ITextWidget>().Text = ${cs(c.description)};`);

	c.events.forEach((e, i) => feedbackAction(add, `on${i}`, `Example${e.name}`, ['Example'], `Example + ": ${e.name}"`));
	const hasItems = c.placeholders.some((p) => (p.example || []).length);
	if (hasItems) feedbackAction(add, 'onItem', 'ItemClicked', ['Item', 'Example'], 'Example + ": " + Item');

	// The examples are data, and C# loops build them: the lambda stays short enough to pass
	// on unchanged (written out widget by widget it was 56 KB for 11 examples).
	const all = s.groups.flatMap((g, gi) => g.examples.map((ex) => ({ ...ex, g: gi })));
	const n = all.length;
	for (const ex of all) if (/["\\]/.test(ex.title)) fail(`showcase example "${ex.title}": titles can't contain double quotes or backslashes`);
	const items = c.placeholders.filter((p) => (p.example || []).length);
	add(`var groups = new[] { ${s.groups.map((g) => cs(g.title)).join(', ')} };`);
	add(`var inputs = new[] { ${c.inputs.map((p) => cs(p.name)).join(', ')} };`);
	add('var examples = new[] {');
	for (const ex of all) {
		const args = ex.args || {};
		add(`\tnew { G = ${ex.g}, Title = ${cs(ex.title)}, Ext = ${cs(args.ExtendedClass || '')}, Args = new[] { ${c.inputs.map((p) => cs(args[p.name] ?? p.example ?? p.default)).join(', ')} } },`);
	}
	add('};');
	items.forEach((p, pi) => add(`var items${pi} = new[] { ${p.example.map((it) => `new[] { ${cs(it.label)}, ${cs(it.icon || '')} }`).join(', ')} };`));
	add(`var rows = new List<${WEB}.Widgets.IContainerWidget>();`);
	add('for (var gi = 0; gi < groups.Length; gi++) {');
	add(`\tvar g = main.CreateWidget<${WEB}.Widgets.IContainerWidget>("Group" + (gi + 1)); g.StyleClasses = "margin-bottom-l";`);
	add(`\tvar gh = g.CreateWidget<${WEB}.Widgets.IContainerWidget>("Group" + (gi + 1) + "Title"); gh.StyleClasses = "heading5 margin-bottom-m";`);
	add(`\tgh.CreateWidget<${WEB}.Widgets.ITextWidget>().Text = groups[gi];`);
	add(`\tvar gr = g.CreateWidget<${WEB}.Widgets.IContainerWidget>("Group" + (gi + 1) + "Examples"); gr.StyleClasses = "display-flex flex-wrap gap-xl";`);
	add('\trows.Add(gr);');
	add('}');
	add('var counts = new int[groups.Length];');
	add('foreach (var ex in examples) {');
	add('\tcounts[ex.G]++;');
	add('\tvar id = "Example" + (ex.G + 1) + "_" + counts[ex.G];');
	add('\tvar label = "\\"" + ex.Title + "\\"";');
	add(`\tvar box = rows[ex.G].CreateWidget<${WEB}.Widgets.IContainerWidget>(id); box.StyleClasses = "display-flex flex-direction-column gap-s";`);
	add(`\tvar cap = box.CreateWidget<${WEB}.Widgets.IContainerWidget>(id + "Caption"); cap.StyleClasses = "font-size-xs text-neutral-7";`);
	add(`\tcap.CreateWidget<${WEB}.Widgets.ITextWidget>().Text = ex.Title;`);
	add(`\tvar inst = box.CreateWidget<${WEB}.Widgets.IWebBlockInstanceWidget>(); inst.SourceBlock = cardBlock;`);
	add('\tfor (var i = 0; i < inputs.Length; i++) inst.SetArgumentValue(cardBlock.InputParameters.First(p => p.Name == inputs[i]), ex.Args[i]);');
	add('\tif (ex.Ext != "") inst.SetArgumentValue(cardBlock.InputParameters.First(p => p.Name == "ExtendedClass"), ex.Ext);');
	c.events.forEach((e, i) => {
		add(`\tvar h${i} = inst.EventHandlers.First(h => h.Event.Name == ${cs(e.name)}); h${i}.Handler = on${i};`);
		add(`\th${i}.Arguments.First(a => a.Parameter.Name == "Example").SetValue(label);`);
	});
	items.forEach((p, pi) => {
		add(`\tvar pc${pi} = inst.PlaceholdersContent.First(q => q.Placeholder?.Name == ${cs(p.name)});`);
		add(`\tforeach (var it in items${pi}) {`);
		add(`\t\tvar l = pc${pi}.CreateWidget<${WEB}.Widgets.ILinkWidget>();${p.itemClass ? ` l.StyleClasses = ${cs(p.itemClass)};` : ''}`);
		add('\t\tl.OnClick.Destination = onItem; l.OnClick.Method = OutSystems.Model.Enumerations.Method.Ajax;');
		add('\t\tl.OnClick.Arguments.First(a => a.Parameter.Name == "Item").SetValue("\\"" + it[0] + "\\"");');
		add('\t\tl.OnClick.Arguments.First(a => a.Parameter.Name == "Example").SetValue(label);');
		add(
			`\t\tif (it[1] != "") { var ic = l.CreateWidget<${WEB}.Widgets.IExpressionWidget>(); ic.EscapeContent = false; ic.SetValue("\\"<span class='icon fa fa-" + it[1] + "' aria-hidden='true'></span>\\""); }`,
		);
		add(`\t\tl.CreateWidget<${WEB}.Widgets.ITextWidget>().Text = it[0];`);
		add('\t}');
	});
	add('}');

	const links = c.placeholders.reduce((sum, p) => sum + (p.example || []).length, 0) * n;
	const summary = `"PROBE:screen=" + scr.Name + " instances=" + scr.GetAllDescendantsOfType<${WEB}.Widgets.IWebBlockInstanceWidget>().Count(w => w.SourceBlock == cardBlock) + " links=" + scr.GetAllDescendantsOfType<${WEB}.Widgets.ILinkWidget>().Count() + " actions=" + string.Join(",", scr.ScreenActions.Select(a => a.Name).OrderBy(z => z))`;
	const actions = [...c.events.map((e) => `Example${e.name}`), ...(hasItems ? ['ItemClicked'] : [])].sort();
	const expected = `screen=${screenName} instances=${n} links=${links} actions=${actions.join(',')}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`showcase-${c.folder}-traditional`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

// ---- script: dist/components.js as one Script, created or replaced ----
function script() {
	if (TRADITIONAL) return scriptTraditional();
	const name = option('name', SCRIPT);
	const js = readDist('components.js');
	const body = (tail) => `eSpace => {
	var s = eSpace.Scripts.FirstOrDefault(x => x.Name == ${cs(name)}) ?? eSpace.CreateScript(${cs(name)});
	s.Description = ${cs(`AIOutsystemsFED components: dist/components.js ${js.version}, built ${js.built}. Generated from the repo; don't edit here, rebuild and replace.`)};
	s.JavaScript = ${cs(js.text)};${tail}
}`;
	const probe = `
	var j = s.JavaScript; ${CHECKSUM_CS('j')}
	throw new Exception("PROBE:name=" + s.Name + " len=" + j.Length + " hash=" + h);`;
	write('script', body(''), body(probe), `name=${name} len=${js.text.length} hash=${checksum(js.text)}`);
}

// ---- theme: dist/components.css as one marked section of a theme stylesheet ----
function theme() {
	const themeName = option('theme', TRADITIONAL ? traditionalConfig().theme : config.o11.theme);
	const themeType = TRADITIONAL ? `${WEB}.IWebTheme` : 'IMobileTheme';
	const outName = TRADITIONAL ? 'theme-traditional' : 'theme';
	const css = readDist('components.css');
	const GUARD = '.components-start { }';
	const END = '/* ==== components: end ==== */';
	// The guard rule absorbs the 2 characters Theme Editor's block has been seen to drop (Components_11.md, The stylesheet).
	const section = `${GUARD}\n/* ==== components: start (built ${css.built}) ==== */\n${css.text}${END}\n`;
	const find = `var t = eSpace.GetAllDescendantsOfType<${themeType}>().FirstOrDefault(x => x.Name == ${cs(themeName)});
	if (t == null) throw new Exception("PROBE:no theme named ${themeName}");
	var css = t.StyleSheet ?? "";
	var guard = ${cs(GUARD)}; var endMarker = ${cs(END)};
	var start = css.IndexOf(guard); var end = css.IndexOf(endMarker);`;
	const apply = `eSpace => {
	${find}
	var section = ${cs(section)};
	if (start >= 0 && end > start) {
		var after = end + endMarker.Length;
		if (after < css.Length && css[after] == (char)13) after++;
		if (after < css.Length && css[after] == (char)10) after++;
		css = css.Substring(0, start) + section + css.Substring(after);
	} else if (start >= 0 || end >= 0) {
		throw new Exception("PROBE:the components section has only one of its markers; fix the theme stylesheet in Service Studio first");
	} else {
		css = css + (char)10 + section;
	}
	t.StyleSheet = css;
}`;
	const probe = `eSpace => {
	${find}
	if (start < 0 || end < start) throw new Exception("PROBE:no components section");
	var got = css.Substring(start, end + endMarker.Length - start) + (char)10; ${CHECKSUM_CS('got')}
	var sections = css.Split(new[] { guard }, StringSplitOptions.None).Length - 1;
	throw new Exception("PROBE:sections=" + sections + " len=" + got.Length + " hash=" + h);
}`;
	write(outName, apply, probe, `sections=1 len=${section.length} hash=${checksum(section)}`);
	console.log(`Apply ${outName}.cs, then run ${outName}.probe.cs (the stylesheet reads back only after a save), then merge.`);
}

// ---- block: the Block that bridges to the class, from component.json ----
function block() {
	if (TRADITIONAL) return blockTraditional();
	const c = contractOf(target);
	const blockName = option('name', c.class);
	const flowName = option('flow', config.o11.blockFlow);
	const isPublic = flag('public');
	const ns = `${config.namespace}.${c.class}`;
	const modifiers = c.modifiers.length ? ` Modifiers: ${c.modifiers.map((m) => `${m.class} (${m.description})`).join('; ')}.` : '';
	const L = [];
	const add = (line) => L.push(`\t${line}`);

	// The flow is created when missing (CreateMobileFlow, measured 2026-10-22). Block names are unique in the module.
	add(`var flow = eSpace.MobileFlows.FirstOrDefault(f => f.Name == ${cs(flowName)}) ?? eSpace.CreateMobileFlow(${cs(flowName)});`);
	add(
		`if (eSpace.MobileFlows.SelectMany(f => f.Nodes).OfType<IMobileBlock>().Any(b => b.Name == ${cs(blockName)})) throw new Exception("PROBE:a Block named ${blockName} already exists; this generator only creates Blocks");`,
	);
	add(`var script = eSpace.Scripts.FirstOrDefault(s => s.Name == ${cs(SCRIPT)});`);
	add(`if (script == null) throw new Exception("PROBE:no Script named ${SCRIPT}; apply script.cs first");`);
	add(`var block = flow.CreateBlock(${cs(blockName)});`);
	add(`block.Description = ${cs(`${c.description} Bridge to window.${ns} (Script ${SCRIPT}). Generated from ${c.dir === templatesDir ? 'templates' : 'components'}/${c.folder}/component.json.`)};`);
	add(`block.Public = ${isPublic ? 'true' : 'false'};`);
	add(`block.RequiredScripts.Add(script);`);
	c.inputs.forEach((p, i) => {
		add(
			`var in${i} = block.CreateInputParameter(${cs(p.name)}); in${i}.DataType = ${TYPES[p.type].modelApi}; in${i}.IsMandatory = ${p.mandatory}; in${i}.SetDefaultValue(${cs(p.default)}); in${i}.Description = ${cs(p.description)};`,
		);
	});
	add(`var inExt = block.CreateInputParameter("ExtendedClass"); inExt.DataType = eSpace.TextType; inExt.IsMandatory = false; inExt.SetDefaultValue(${cs('""')});`);
	add(`inExt.Description = ${cs(`Extra classes for the main container (MountPoint). Applied by the Block, never passed to the class.${modifiers}`)};`);
	c.events.forEach((e, i) => {
		add(`var ev${i} = block.CreateEvent(${cs(e.name)}); ev${i}.IsMandatory = false; ev${i}.Description = ${cs(e.description)};`);
		(e.params || []).forEach((p, j) =>
			add(`var ev${i}p${j} = ev${i}.CreateInputParameter(${cs(p.name)}); ev${i}p${j}.DataType = ${TYPES[p.type].modelApi};${p.description ? ` ev${i}p${j}.Description = ${cs(p.description)};` : ''}`),
		);
	});
	add(`var instance = block.CreateLocalVariable("Instance"); instance.DataType = eSpace.ObjectType;`);
	add(`var mount = block.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>("MountPoint");`);
	add(`mount.SetStyle(${cs(`"${c.block}" + If(ExtendedClass <> NullTextIdentifier(), " " + ExtendedClass, "")`)});`);
	// Each placeholder sits in a container of its own inside the mount (class <block>__<name>);
	// the class gets that container's id and only shows, hides or positions it.
	c.placeholders.forEach((p, i) => {
		add(`var ph${i}c = mount.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`${p.name}Container`)}); ph${i}c.SetStyle(${cs(`"${c.block}__${kebab(p.name)}"`)});`);
		add(`var ph${i} = ph${i}c.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IPlaceholderWidget>(${cs(p.name)}); ph${i}.Description = ${cs(p.description)};`);
	});

	// One bridge Client Action per event: $actions in a JS node lists Client Actions, not Block Events.
	// A parameter named like a Block input would be renamed (Value -> Value2) and the trigger's
	// argument would then read the Block input; such parameters get an Event prefix instead.
	const blockInputs = new Set([...c.inputs.map((p) => p.name), 'ExtendedClass', 'Instance']);
	c.events.forEach((e, i) => {
		const a = `tr${i}`;
		add(`var ${a} = block.CreateScreenAction(${cs(bridgeAction(e.name))});`);
		(e.params || []).forEach((p, j) => {
			const name = blockInputs.has(p.name) ? `Event${p.name}` : p.name;
			add(`var ${a}p${j} = ${a}.CreateInputParameter(${cs(name)}); ${a}p${j}.DataType = ${TYPES[p.type].modelApi};`);
		});
		add(`var ${a}Start = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();`);
		add(`var ${a}Node = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.ITriggerNode>().ConnectedBelow(${a}Start); ${a}Node.Event = ev${i};`);
		(e.params || []).forEach((p, j) => add(`${a}Node.SetArgumentValue(ev${i}p${j}, ${a}p${j}.Name);`));
		add(`${a}.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(${a}Node);`);
	});

	// A lifecycle handler: Start -> one JS node (-> Assign) -> End, wired to the Block event.
	const handler = (lifecycle, nodeName, js, inputs, output) => {
		const a = lifecycle.charAt(0).toLowerCase() + lifecycle.slice(1);
		add(`var ${a} = block.CreateScreenAction(${cs(lifecycle)});`);
		add(`var ${a}Start = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();`);
		add(`var ${a}Js = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.IJavaScriptNode>(${cs(nodeName)}).ConnectedBelow(${a}Start);`);
		add(`${a}Js.JavaScript = ${cs(js)};`);
		inputs.forEach(([name, type, value], k) => {
			add(`var ${a}In${k} = ${a}Js.CreateInputParameter(${cs(name)}); ${a}In${k}.DataType = ${type}; ${a}Js.SetArgumentValue(${a}In${k}, ${cs(value)});`);
		});
		let last = `${a}Js`;
		if (output) {
			add(`var ${a}Out = ${a}Js.CreateOutputParameter("Instance"); ${a}Out.DataType = eSpace.ObjectType;`);
			add(`var ${a}Assign = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.IAssignNode>().ConnectedBelow(${a}Js); ${a}Assign.CreateAssignment("Instance", ${cs(`${nodeName}.Instance`)});`);
			last = `${a}Assign`;
		}
		add(`${a}.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(${last});`);
		add(`block.${lifecycle}.Destination = ${a};`);
	};
	const inputArgs = c.inputs.map((p) => [p.name, TYPES[p.type].modelApi, p.name]);
	const events = c.events.length ? [`  events: { ${c.events.map((e) => `${e.name}: $actions.${bridgeAction(e.name)}`).join(', ')} }`] : [];
	const createJs = [
		`$parameters.Instance = new ${ns}({`,
		[
			'  runtimeId: $parameters.RuntimeId',
			...c.placeholders.map((p) => `  ${camel(p.name)}Id: $parameters.${p.name}Id`),
			...c.inputs.map((p) => `  ${camel(p.name)}: $parameters.${p.name}`),
			...events,
		].join(',\n'),
		'});',
	].join('\n');
	const placeholderArgs = c.placeholders.map((p) => [`${p.name}Id`, 'eSpace.TextType', `${p.name}Container.Id`]);
	handler('OnReady', `Create${c.class}`, createJs, [['RuntimeId', 'eSpace.TextType', 'MountPoint.Id'], ...placeholderArgs, ...inputArgs], true);
	if (c.inputs.length) {
		const updateJs = ['if ($parameters.Instance) {', `  $parameters.Instance.onParametersChanged({`, c.inputs.map((p) => `    ${camel(p.name)}: $parameters.${p.name}`).join(',\n'), '  });', '}'].join(
			'\n',
		);
		handler('OnParametersChanged', `Update${c.class}`, updateJs, [['Instance', 'eSpace.ObjectType', 'Instance'], ...inputArgs], false);
	}
	handler('OnDestroy', `Destroy${c.class}`, 'if ($parameters.Instance) {\n  $parameters.Instance.destroy();\n}', [['Instance', 'eSpace.ObjectType', 'Instance']], false);

	// Placeholders only appear in the probe line of a Block that has them, so the other Blocks' lines don't change.
	const placeholderProbe = c.placeholders.length ? ` + " placeholders=" + string.Join(",", new[] { ${c.placeholders.map((p, i) => `ph${i}.Name`).join(', ')} })` : '';
	const summary = `"PROBE:block=" + block.Name + " inputs=" + string.Join(",", block.InputParameters.Select(p => p.Name)) + " events=" + string.Join(",", block.Events.Select(e => e.Name)) + " actions=" + string.Join(",", block.ScreenActions.Select(a => a.Name).OrderBy(n => n)) + " scripts=" + string.Join(",", block.RequiredScripts.Select(s => s.Name))${placeholderProbe}`;
	const actions = [...c.events.map((e) => bridgeAction(e.name)), 'OnDestroy', ...(c.inputs.length ? ['OnParametersChanged'] : []), 'OnReady'].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
	const expected = `block=${blockName} inputs=${[...c.inputs.map((p) => p.name), 'ExtendedClass'].join(',')} events=${c.events.map((e) => e.name).join(',')} actions=${actions.join(',')} scripts=${SCRIPT}${c.placeholders.length ? ` placeholders=${c.placeholders.map((p) => p.name).join(',')}` : ''}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`block-${c.folder}`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

// Fills each placeholder of a Block instance with the contract's example: one Link per
// item, an Icon then the label, with the placeholder's itemClass. Each Link's On Click
// goes to the screen action in itemAction (variable name), with Item = the label and,
// when given, Example = example (an expression).
function fillPlaceholders(add, c, inst, itemAction, example) {
	c.placeholders.forEach((p, i) => {
		if (!(p.example || []).length) return;
		const v = `${inst}ph${i}`;
		add(`var ${v} = ${inst}.PlaceholdersContent.First(pc => pc.Placeholder?.Name == ${cs(p.name)});`);
		p.example.forEach((item, j) => {
			const l = `${v}l${j}`;
			add(`var ${l} = ${v}.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILink>();${p.itemClass ? ` ${l}.SetStyle(${cs(`"${p.itemClass}"`)});` : ''}`);
			add(`${l}.Widgets.OfType<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().First().Text = ${cs(item.label)};`);
			if (item.icon) {
				add(`var ${l}i = ${l}.CreateWidget<ServiceStudio.Plugin.NRWidgets.IIcon>(); ${l}i.Icon = ${cs(item.icon)};`);
				add(`((OutSystems.Model.ISequence<OutSystems.Model.UI.Mobile.Widgets.IMobileWidget>)${l}.Widgets).MoveToStart(${l}i);`);
			}
			add(`${l}.OnClick.Destination = ${itemAction};`);
			add(`${l}.OnClick.Arguments.First(a => a.Parameter.Name == "Item").SetValue(${cs(`"${item.label}"`)});`);
			if (example) add(`${l}.OnClick.Arguments.First(a => a.Parameter.Name == "Example").SetValue(${cs(example)});`);
		});
	});
}

// A screen action that shows a message: name, Text input parameters, and the message expression.
function messageAction(add, v, name, params, message) {
	add(`var ${v} = scr.CreateScreenAction(${cs(name)});`);
	params.forEach(([pname, type], j) => add(`var ${v}p${j} = ${v}.CreateInputParameter(${cs(pname)}); ${v}p${j}.DataType = ${type};`));
	add(`var ${v}Start = ${v}.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();`);
	add(`var ${v}Msg = ${v}.CreateNode<OutSystems.Model.Logic.Nodes.IMessageNode>().ConnectedBelow(${v}Start); ${v}Msg.SetMessage(${cs(message)});`);
	add(`${v}.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(${v}Msg);`);
}

// The start of a screen on the layout, in a flow, for a Block: shared by harness and showcase.
function screenStart(add, c, { screenName, flowName, blockName, blockFlow, description, title }) {
	add(`var flow = eSpace.MobileFlows.FirstOrDefault(f => f.Name == ${cs(flowName)});`);
	add(`if (flow == null) throw new Exception("PROBE:no UI flow named ${flowName}");`);
	add(`if (flow.Nodes.OfType<IMobileScreen>().Any(s => s.Name == ${cs(screenName)})) throw new Exception("PROBE:a screen named ${screenName} already exists");`);
	add(`var cardBlock = eSpace.MobileFlows.Where(f => f.Name == ${cs(blockFlow)}).SelectMany(f => f.Nodes).OfType<IMobileBlock>().FirstOrDefault(b => b.Name == ${cs(blockName)});`);
	add(`if (cardBlock == null) throw new Exception("PROBE:no Block named ${blockName} in ${blockFlow}; apply the block lambda first");`);
	add(`var layoutBlk = eSpace.MobileFlows.First(f => f.Name == "Layouts").Nodes.OfType<IMobileBlock>().First(b => b.Name == ${cs(config.o11.layout)});`);
	add(`var x = flow.Nodes.OfType<IMobileScreen>().Select(s => s.HorizontalPosition).DefaultIfEmpty(0).Max() + 1000;`);
	add(`var scr = flow.CreateScreen(${cs(screenName)});`);
	add(`scr.Widgets.ToList().ForEach(w => w.Delete());`);
	add(`scr.Description = ${cs(description)};`);
	add(`scr.SetTitle(${cs(`"${title}"`)});`);
	add(`scr.HorizontalPosition = x; scr.VerticalPosition = 700;`);
	add(`scr.Roles.Add(eSpace.SystemRoles.OfType<OutSystems.Model.Logic.ISystemRole>().First(r => r.Name == ${cs(config.o11.harnessRole)}));`);
	add(`var layout = scr.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();`);
	add(`layout.SourceBlock = layoutBlk;`);
	add(`layout.PlaceholdersContent.First(p => p.Placeholder?.Name == "Title").CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().Text = ${cs(title)};`);
	add(`var main = layout.PlaceholdersContent.First(p => p.Placeholder?.Name == "MainContent");`);
}

// ---- harness: a test screen that drives every input and shows every event ----
function harness() {
	if (TRADITIONAL) fail('harness has no Traditional Web version yet; use showcase --traditional');
	const c = contractOf(target);
	const screenName = option('screen', `${c.class}Test`);
	const flowName = option('flow', config.o11.flow);
	const blockName = option('block', c.class);
	const blockFlow = option('block-flow', config.o11.blockFlow);
	const L = [];
	const add = (line) => L.push(`\t${line}`);
	screenStart(add, c, {
		screenName,
		flowName,
		blockName,
		blockFlow,
		title: `${c.class} test`,
		description: `Test harness for the ${blockName} Block, generated from ${c.dir === templatesDir ? 'templates' : 'components'}/${c.folder}/component.json. Not an app screen; delete it once the Block is used on real screens.`,
	});
	add(`var harness = main.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`${c.class}Harness`)});`);
	c.inputs.forEach((p, i) => {
		add(`var v${i} = scr.CreateLocalVariable(${cs(`${p.name}Value`)}); v${i}.DataType = ${TYPES[p.type].modelApi}; v${i}.SetDefaultValue(${cs(p.example || p.default)});`);
		add(`var f${i} = harness.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`${p.name}Field`)}); f${i}.SetStyle(${cs('"margin-bottom-base"')});`);
		add(`var l${i} = f${i}.CreateWidget<ServiceStudio.Plugin.NRWidgets.ILabel>(${cs(`${p.name}Label`)});`);
		// A Boolean gets a Checkbox (ICheckbox, bound like an Input: measured 2026-10-22).
		const widget = p.type === 'Boolean' ? 'ICheckbox' : 'IInput';
		add(`var i${i} = f${i}.CreateWidget<ServiceStudio.Plugin.NRWidgets.${widget}>(${cs(`${p.name}Input`)}); i${i}.SetVariable(${cs(`${p.name}Value`)});`);
		if (p.type !== 'Text' && p.type !== 'Boolean') add(`i${i}.InputType = ServiceStudio.Plugin.NRWidgets.Enumerations.InputType.Number;`);
		add(`((OutSystems.Model.UI.Mobile.Widgets.ITextWidget)l${i}.Widgets.First()).Text = ${cs(p.name)}; l${i}.TargetWidget = i${i};`);
	});
	add(`var inst = harness.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();`);
	add(`inst.SourceBlock = cardBlock;`);
	c.inputs.forEach((p) => add(`inst.SetArgumentValue(cardBlock.InputParameters.First(p => p.Name == ${cs(p.name)}), ${cs(`${p.name}Value`)});`));
	c.events.forEach((e, i) => {
		const a = `on${i}`;
		add(`var ${a} = scr.CreateScreenAction(${cs(`${c.class}${e.name}`)});`);
		(e.params || []).forEach((p, j) => add(`var ${a}p${j} = ${a}.CreateInputParameter(${cs(p.name)}); ${a}p${j}.DataType = ${TYPES[p.type].modelApi};`));
		add(`var ${a}Start = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.IStartNode>();`);
		const message = [`"${e.name} fired"`, ...(e.params || []).map((p, j) => `"${j ? ', ' : ': '}${p.name} = " + ${p.name}`)].join(' + ');
		add(`var ${a}Msg = ${a}.CreateNode<OutSystems.Model.Logic.Nodes.IMessageNode>().ConnectedBelow(${a}Start); ${a}Msg.SetMessage(${cs(message)});`);
		add(`${a}.CreateNode<OutSystems.Model.Logic.Nodes.IEndNode>().ConnectedBelow(${a}Msg);`);
		add(`var ${a}H = inst.EventHandlers.First(h => h.Event.Name == ${cs(e.name)}); ${a}H.Handler = ${a};`);
		(e.params || []).forEach((p) => add(`${a}H.Arguments.First(arg => arg.Parameter.Name == ${cs(p.name)}).SetValue(${cs(p.name)});`));
	});
	const hasItems = c.placeholders.some((p) => (p.example || []).length);
	if (hasItems) {
		messageAction(add, 'onItem', 'ItemClicked', [['Item', 'eSpace.TextType']], '"Clicked: " + Item');
		fillPlaceholders(add, c, 'inst', 'onItem');
	}
	const summary = `"PROBE:screen=" + scr.Name + " vars=" + string.Join(",", scr.LocalVariables.Select(v => v.Name)) + " actions=" + string.Join(",", scr.ScreenActions.Select(a => a.Name).OrderBy(n => n))`;
	const expected = `screen=${screenName} vars=${c.inputs.map((p) => `${p.name}Value`).join(',')} actions=${[...c.events.map((e) => `${c.class}${e.name}`), ...(hasItems ? ['ItemClicked'] : [])].sort().join(',')}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`harness-${c.folder}`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

// ---- showcase: an example screen, one Block instance per example in component.json ----
// Each group is a heading and a wrapping row of examples; each example is a caption
// above a Block instance with the example's arguments (inputs not given use their
// example). Every event goes to one screen action, Example<Event>, and every item put
// in a placeholder to ItemClicked; both show a message naming the example.
function showcase() {
	if (TRADITIONAL) return showcaseTraditional();
	const c = contractOf(target);
	if (!c.showcase) fail(`${c.folder}/component.json has no "showcase"`);
	const s = c.showcase;
	const screenName = option('screen', s.screen);
	const blockName = option('block', c.class);
	const L = [];
	const add = (line) => L.push(`\t${line}`);
	screenStart(add, c, {
		screenName,
		flowName: option('flow', config.o11.flow),
		blockName,
		blockFlow: option('block-flow', config.o11.blockFlow),
		title: s.title,
		description: `Examples of the ${blockName} Block, generated from ${c.dir === templatesDir ? 'templates' : 'components'}/${c.folder}/component.json (showcase).`,
	});
	add(`var intro = main.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>("Intro"); intro.SetStyle(${cs('"text-neutral-7 margin-bottom-l"')});`);
	add(`intro.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().Text = ${cs(c.description)};`);

	// One action per event and one for placeholder items, each told which example raised it.
	c.events.forEach((e, i) => {
		const params = [...(e.params || []).map((p) => [p.name, TYPES[p.type].modelApi]), ['Example', 'eSpace.TextType']];
		const message = ['Example', `": ${e.name}"`, ...(e.params || []).map((p, j) => `"${j ? ', ' : ' ('}${p.name} = " + ${p.name}`), ...((e.params || []).length ? ['")"'] : [])].join(' + ');
		messageAction(add, `on${i}`, `Example${e.name}`, params, message);
	});
	const hasItems = c.placeholders.some((p) => (p.example || []).length);
	if (hasItems)
		messageAction(
			add,
			'onItem',
			'ItemClicked',
			[
				['Item', 'eSpace.TextType'],
				['Example', 'eSpace.TextType'],
			],
			'Example + ": " + Item',
		);

	let n = 0;
	s.groups.forEach((g, gi) => {
		const gv = `g${gi}`;
		add(`var ${gv} = main.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`Group${gi + 1}`)}); ${gv}.SetStyle(${cs('"margin-bottom-l"')});`);
		add(`var ${gv}h = ${gv}.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`Group${gi + 1}Title`)}); ${gv}h.SetStyle(${cs('"heading5 margin-bottom-m"')});`);
		add(`${gv}h.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().Text = ${cs(g.title)};`);
		add(`var ${gv}r = ${gv}.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`Group${gi + 1}Examples`)}); ${gv}r.SetStyle(${cs('"display-flex flex-wrap gap-xl"')});`);
		g.examples.forEach((x, xi) => {
			const ev = `e${gi}_${xi}`;
			const id = `Example${gi + 1}_${xi + 1}`;
			const label = `"${x.title}"`;
			add(`var ${ev} = ${gv}r.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(id)}); ${ev}.SetStyle(${cs('"display-flex flex-direction-column gap-s"')});`);
			add(`var ${ev}t = ${ev}.CreateWidget<ServiceStudio.Plugin.NRWidgets.IContainer>(${cs(`${id}Caption`)}); ${ev}t.SetStyle(${cs('"font-size-xs text-neutral-7"')});`);
			add(`${ev}t.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().Text = ${cs(x.title)};`);
			const inst = `${ev}b`;
			add(`var ${inst} = ${ev}.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>(); ${inst}.SourceBlock = cardBlock;`);
			const args = x.args || {};
			for (const p of c.inputs) add(`${inst}.SetArgumentValue(cardBlock.InputParameters.First(p => p.Name == ${cs(p.name)}), ${cs(args[p.name] ?? p.example ?? p.default)});`);
			if (args.ExtendedClass) add(`${inst}.SetArgumentValue(cardBlock.InputParameters.First(p => p.Name == "ExtendedClass"), ${cs(args.ExtendedClass)});`);
			c.events.forEach((e, i) => {
				add(`var ${inst}h${i} = ${inst}.EventHandlers.First(h => h.Event.Name == ${cs(e.name)}); ${inst}h${i}.Handler = on${i};`);
				(e.params || []).forEach((p) => add(`${inst}h${i}.Arguments.First(arg => arg.Parameter.Name == ${cs(p.name)}).SetValue(${cs(p.name)});`));
				add(`${inst}h${i}.Arguments.First(arg => arg.Parameter.Name == "Example").SetValue(${cs(label)});`);
			});
			if (hasItems) fillPlaceholders(add, c, inst, 'onItem', label);
			n++;
		});
	});

	const links = c.placeholders.reduce((sum, p) => sum + (p.example || []).length, 0) * n;
	const summary = `"PROBE:screen=" + scr.Name + " instances=" + scr.GetAllDescendantsOfType<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>().Count(w => w.SourceBlock == cardBlock) + " links=" + scr.GetAllDescendantsOfType<ServiceStudio.Plugin.NRWidgets.ILink>().Count() + " actions=" + string.Join(",", scr.ScreenActions.Select(a => a.Name).OrderBy(n => n))`;
	const actions = [...c.events.map((e) => `Example${e.name}`), ...(hasItems ? ['ItemClicked'] : [])].sort();
	const expected = `screen=${screenName} instances=${n} links=${links} actions=${actions.join(',')}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`showcase-${c.folder}`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

const commands = { script, theme, block, harness, showcase };
if (!commands[command]) fail(`unknown command "${command || ''}"; use one of: ${Object.keys(commands).join(', ')}`);
commands[command]();
