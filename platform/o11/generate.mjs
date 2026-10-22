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
//   node platform/o11/generate.mjs harness <component> [--screen <Class>Test] [--flow <Flow>] [--block <Block>]
//
// Script, theme, flow, layout and harness role default to factory.config.json ("o11").
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
import { bridgeAction, camel, componentsDir, loadContract, root, templatesDir, TYPES } from '../../scripts/lib/contract.mjs';

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

// ---- script: dist/components.js as one Script, created or replaced ----
function script() {
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
	const themeName = option('theme', config.o11.theme);
	const css = readDist('components.css');
	const GUARD = '.components-start { }';
	const END = '/* ==== components: end ==== */';
	// The guard rule absorbs the 2 characters Theme Editor's block has been seen to drop (Components_11.md, The stylesheet).
	const section = `${GUARD}\n/* ==== components: start (built ${css.built}) ==== */\n${css.text}${END}\n`;
	const find = `var t = eSpace.GetAllDescendantsOfType<IMobileTheme>().FirstOrDefault(x => x.Name == ${cs(themeName)});
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
	write('theme', apply, probe, `sections=1 len=${section.length} hash=${checksum(section)}`);
	console.log('Apply theme.cs, then run theme.probe.cs (the stylesheet reads back only after a save), then merge.');
}

// ---- block: the Block that bridges to the class, from component.json ----
function block() {
	const c = contractOf(target);
	const blockName = option('name', c.class);
	const flowName = option('flow', config.o11.flow);
	const isPublic = flag('public');
	const ns = `${config.namespace}.${c.class}`;
	const modifiers = c.modifiers.length ? ` Modifiers: ${c.modifiers.map((m) => `${m.class} (${m.description})`).join('; ')}.` : '';
	const L = [];
	const add = (line) => L.push(`\t${line}`);

	add(`var flow = eSpace.MobileFlows.FirstOrDefault(f => f.Name == ${cs(flowName)});`);
	add(`if (flow == null) throw new Exception("PROBE:no UI flow named ${flowName}");`);
	add(`if (flow.Nodes.OfType<IMobileBlock>().Any(b => b.Name == ${cs(blockName)})) throw new Exception("PROBE:a Block named ${blockName} already exists; this generator only creates Blocks");`);
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
		['  runtimeId: $parameters.RuntimeId', ...c.inputs.map((p) => `  ${camel(p.name)}: $parameters.${p.name}`), ...events].join(',\n'),
		'});',
	].join('\n');
	handler('OnReady', `Create${c.class}`, createJs, [['RuntimeId', 'eSpace.TextType', 'MountPoint.Id'], ...inputArgs], true);
	if (c.inputs.length) {
		const updateJs = ['if ($parameters.Instance) {', `  $parameters.Instance.onParametersChanged({`, c.inputs.map((p) => `    ${camel(p.name)}: $parameters.${p.name}`).join(',\n'), '  });', '}'].join(
			'\n',
		);
		handler('OnParametersChanged', `Update${c.class}`, updateJs, [['Instance', 'eSpace.ObjectType', 'Instance'], ...inputArgs], false);
	}
	handler('OnDestroy', `Destroy${c.class}`, 'if ($parameters.Instance) {\n  $parameters.Instance.destroy();\n}', [['Instance', 'eSpace.ObjectType', 'Instance']], false);

	const summary = `"PROBE:block=" + block.Name + " inputs=" + string.Join(",", block.InputParameters.Select(p => p.Name)) + " events=" + string.Join(",", block.Events.Select(e => e.Name)) + " actions=" + string.Join(",", block.ScreenActions.Select(a => a.Name).OrderBy(n => n)) + " scripts=" + string.Join(",", block.RequiredScripts.Select(s => s.Name))`;
	const actions = [...c.events.map((e) => bridgeAction(e.name)), 'OnDestroy', ...(c.inputs.length ? ['OnParametersChanged'] : []), 'OnReady'].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
	const expected = `block=${blockName} inputs=${[...c.inputs.map((p) => p.name), 'ExtendedClass'].join(',')} events=${c.events.map((e) => e.name).join(',')} actions=${actions.join(',')} scripts=${SCRIPT}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`block-${c.folder}`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

// ---- harness: a test screen that drives every input and shows every event ----
function harness() {
	const c = contractOf(target);
	const screenName = option('screen', `${c.class}Test`);
	const flowName = option('flow', config.o11.flow);
	const blockName = option('block', c.class);
	const L = [];
	const add = (line) => L.push(`\t${line}`);
	add(`var flow = eSpace.MobileFlows.FirstOrDefault(f => f.Name == ${cs(flowName)});`);
	add(`if (flow == null) throw new Exception("PROBE:no UI flow named ${flowName}");`);
	add(`if (flow.Nodes.OfType<IMobileScreen>().Any(s => s.Name == ${cs(screenName)})) throw new Exception("PROBE:a screen named ${screenName} already exists");`);
	add(`var cardBlock = flow.Nodes.OfType<IMobileBlock>().FirstOrDefault(b => b.Name == ${cs(blockName)});`);
	add(`if (cardBlock == null) throw new Exception("PROBE:no Block named ${blockName} in ${flowName}; apply the block lambda first");`);
	add(`var layoutBlk = eSpace.MobileFlows.First(f => f.Name == "Layouts").Nodes.OfType<IMobileBlock>().First(b => b.Name == ${cs(config.o11.layout)});`);
	add(`var x = flow.Nodes.OfType<IMobileScreen>().Select(s => s.HorizontalPosition).DefaultIfEmpty(0).Max() + 1000;`);
	add(`var scr = flow.CreateScreen(${cs(screenName)});`);
	add(`scr.Widgets.ToList().ForEach(w => w.Delete());`);
	add(
		`scr.Description = ${cs(`Test harness for the ${blockName} Block, generated from ${c.dir === templatesDir ? 'templates' : 'components'}/${c.folder}/component.json. Not an app screen; delete it once the Block is used on real screens.`)};`,
	);
	add(`scr.SetTitle(${cs(`"${c.class} test"`)});`);
	add(`scr.HorizontalPosition = x; scr.VerticalPosition = 700;`);
	add(`scr.Roles.Add(eSpace.SystemRoles.OfType<OutSystems.Model.Logic.ISystemRole>().First(r => r.Name == ${cs(config.o11.harnessRole)}));`);
	add(`var layout = scr.CreateWidget<OutSystems.Model.UI.Mobile.Widgets.IMobileBlockInstanceWidget>();`);
	add(`layout.SourceBlock = layoutBlk;`);
	add(`layout.PlaceholdersContent.First(p => p.Placeholder?.Name == "Title").CreateWidget<OutSystems.Model.UI.Mobile.Widgets.ITextWidget>().Text = ${cs(`${c.class} test`)};`);
	add(`var main = layout.PlaceholdersContent.First(p => p.Placeholder?.Name == "MainContent");`);
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
	const summary = `"PROBE:screen=" + scr.Name + " vars=" + string.Join(",", scr.LocalVariables.Select(v => v.Name)) + " actions=" + string.Join(",", scr.ScreenActions.Select(a => a.Name).OrderBy(n => n))`;
	const expected = `screen=${screenName} vars=${c.inputs.map((p) => `${p.name}Value`).join(',')} actions=${c.events
		.map((e) => `${c.class}${e.name}`)
		.sort()
		.join(',')}`;
	const code = (tail) => `eSpace => {\n${L.join('\n')}${tail}\n}`;
	write(`harness-${c.folder}`, code(''), code(`\n\tthrow new Exception(${summary});`), expected);
}

const commands = { script, theme, block, harness };
if (!commands[command]) fail(`unknown command "${command || ''}"; use one of: ${Object.keys(commands).join(', ')}`);
commands[command]();
