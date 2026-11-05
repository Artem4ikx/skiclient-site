/* Home page: module marquee and the live HUD previews. */
(() => {
	const SKI = window.SKI;
	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const $ = sel => document.querySelector(sel);
	const live = name => document.querySelectorAll(`[data-live="${name}"]`);
	const setLive = (name, value) => live(name).forEach(el => { el.textContent = value; });

	// Marquee: the list twice so the -50% loop is seamless
	const marquee = $("#marquee");
	if (marquee) {
		const items = SKI.modules.map(m => `<span class="marquee-item"><i></i>${m.name}</span>`).join("");
		marquee.innerHTML = items + items;
	}

	// FPS bar graph
	const graph = $("#fps-graph");
	const bars = [];
	if (graph) {
		for (let i = 0; i < 40; i++) {
			const bar = document.createElement("i");
			graph.append(bar);
			bars.push(bar);
		}
	}
	let fpsHistory = Array.from({ length: 40 }, (_, i) => 60 + i * 2 + Math.random() * 10);
	const drawGraph = () => bars.forEach((bar, i) => { bar.style.height = `${Math.min(100, fpsHistory[i] / 1.8)}%`; });
	drawGraph();

	if (reduceMotion) return;

	// Keystrokes: plays a short strafing pattern with clicks
	const keys = {};
	document.querySelectorAll("#keys [data-k]").forEach(el => { keys[el.dataset.k] = el; });
	const press = (k, ms) => {
		if (!keys[k]) return;
		keys[k].classList.add("on");
		setTimeout(() => keys[k].classList.remove("on"), ms);
	};
	const clicks = [];
	const pattern = [["w", 900], ["a", 350], ["d", 350], ["a", 300], ["space", 160], ["d", 420], ["s", 200], ["w", 700]];
	let step = 0;
	const movement = () => {
		const [k, ms] = pattern[step++ % pattern.length];
		press(k, ms);
		if (k !== "w" && Math.random() < .6) press("w", ms);
		setTimeout(movement, ms + 60);
	};
	const click = () => {
		press("lmb", 55);
		clicks.push(performance.now());
		if (Math.random() < .08) press("rmb", 120);
		setTimeout(click, 70 + Math.random() * 60);
	};
	let visible = true;
	document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
	if (keys.w) { movement(); click(); }

	// HUD numbers
	let combo = 0;
	setInterval(() => {
		if (!visible) return;
		const now = performance.now();
		while (clicks.length && now - clicks[0] > 1000) clicks.shift();
		const cps = clicks.length;
		setLive("cps", cps);
		setLive("cps2", cps);

		const fps = Math.round(138 + Math.random() * 18);
		setLive("fps", fps);
		setLive("fps2", fps);
		fpsHistory.push(fps - 20 + Math.random() * 40);
		fpsHistory = fpsHistory.slice(-40);
		drawGraph();

		const ping = Math.round(20 + Math.random() * 12);
		setLive("ping", ping);
	}, 500);

	setInterval(() => {
		if (!visible) return;
		combo = Math.random() < .2 ? 0 : combo + 1;
		setLive("combo", `x${combo}`);
		setLive("combo2", combo);
		setLive("reach", (2.4 + Math.random() * .6).toFixed(2));
	}, 1100);
})();
