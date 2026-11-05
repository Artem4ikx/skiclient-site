/* Features page: module catalogue with filters, the details drawer and the crosshair playground. */
(() => {
	const SKI = window.SKI;
	const $ = sel => document.querySelector(sel);
	const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
	const catById = id => SKI.categories.find(c => c.id === id);

	const state = { cat: "all", plan: "all", q: "" };
	const fromHash = location.hash.slice(1);
	if (SKI.categories.some(c => c.id === fromHash)) state.cat = fromHash;

	/* ---------------------------------------------------------------- tabs */
	const tabs = $("#tabs");
	const count = id => SKI.modules.filter(m => id === "all" || m.cat === id).length;
	tabs.innerHTML = [{ id: "all", name: "Все" }, ...SKI.categories].map(c =>
		`<button class="tab${c.id === state.cat ? " on" : ""}" data-cat="${c.id}">${c.icon ? `<span style="width:16px;height:16px;display:inline-flex">${SKI.icons[c.icon]}</span>` : ""}${c.name} <small>${count(c.id)}</small></button>`).join("");

	/* ---------------------------------------------------------------- cards */
	const grid = $("#modules");
	grid.innerHTML = SKI.modules.map((m, i) => {
		const cat = catById(m.cat);
		return `<div class="card glow-card module${m.on ? " on" : ""}" role="button" tabindex="0" data-i="${i}" aria-label="${esc(m.name)}: подробнее">
			<div class="module-top">
				<h3>${esc(m.name)}</h3>
				${m.free ? '<span class="badge badge-free">FREE</span>' : '<span class="badge badge-pro">PRO</span>'}
				<button class="toggle${m.on ? " on" : ""}" data-toggle aria-label="Включить ${esc(m.name)}" aria-pressed="${!!m.on}"${m.always ? " disabled" : ""}></button>
			</div>
			<p>${esc(m.desc)}</p>
			<div class="module-foot">
				<span>⚙ ${m.s.length} ${plural(m.s.length, "настройка", "настройки", "настроек")}</span>
				<span class="cat">${esc(cat.name)}</span>
			</div>
		</div>`;
	}).join("");
	const cards = [...grid.children];

	function plural(n, one, few, many) {
		const m10 = n % 10, m100 = n % 100;
		if (m10 === 1 && m100 !== 11) return one;
		if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
		return many;
	}

	const apply = () => {
		const q = state.q.trim().toLowerCase();
		let shown = 0;
		cards.forEach(card => {
			const m = SKI.modules[card.dataset.i];
			const ok = (state.cat === "all" || m.cat === state.cat)
				&& (state.plan === "all" || (state.plan === "free") === !!m.free)
				&& (!q || `${m.name} ${m.desc} ${m.more}`.toLowerCase().includes(q));
			card.classList.toggle("hide", !ok);
			card.classList.remove("pop");
			if (ok) {
				void card.offsetWidth; // restart the pop animation
				card.style.setProperty("--d", `${Math.min(shown, 12) * 0.035}s`);
				card.classList.add("pop");
				shown++;
			}
		});
		$("#empty").classList.toggle("show", shown === 0);
	};

	tabs.addEventListener("click", e => {
		const btn = e.target.closest("[data-cat]");
		if (!btn) return;
		state.cat = btn.dataset.cat;
		tabs.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t === btn));
		history.replaceState(null, "", state.cat === "all" ? location.pathname : `#${state.cat}`);
		apply();
	});
	$("#plan").addEventListener("click", e => {
		const btn = e.target.closest("[data-plan]");
		if (!btn) return;
		state.plan = btn.dataset.plan;
		$("#plan").querySelectorAll("button").forEach(b => b.classList.toggle("on", b === btn));
		apply();
	});
	let typing;
	$("#q").addEventListener("input", e => {
		clearTimeout(typing);
		typing = setTimeout(() => { state.q = e.target.value; apply(); }, 120);
	});
	apply();

	/* ---------------------------------------------------------------- toggles and drawer */
	grid.addEventListener("click", e => {
		const toggle = e.target.closest("[data-toggle]");
		const card = e.target.closest(".module");
		if (!card) return;
		if (toggle) {
			const on = toggle.classList.toggle("on");
			toggle.setAttribute("aria-pressed", on);
			card.classList.toggle("on", on);
			const m = SKI.modules[card.dataset.i];
			if (on && !m.free) SKI.toast(`${m.name} — модуль Pro. В клиенте он включается после активации ключа.`);
			return;
		}
		openDrawer(SKI.modules[card.dataset.i]);
	});
	grid.addEventListener("keydown", e => {
		if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("module")) {
			e.preventDefault();
			openDrawer(SKI.modules[e.target.dataset.i]);
		}
	});

	const drawer = $("#drawer");
	let lastFocus;
	function openDrawer(m) {
		const cat = catById(m.cat);
		lastFocus = document.activeElement;
		$("#drawer-cat").textContent = `${cat.name} · ${m.free ? "Free" : "Pro"}`;
		$("#drawer-title").textContent = m.name;
		$("#drawer-desc").textContent = m.desc;
		$("#drawer-body").innerHTML = `
			<p style="color:var(--text);font-size:15px;margin-bottom:8px">${esc(m.more)}</p>
			<h4>Настройки</h4>
			${m.s.map(([name, val]) => val.startsWith("#")
				? `<div class="setting">${esc(name)}<span class="val">${val}</span><span class="sw" style="margin-left:8px;background:${val}"></span></div>`
				: `<div class="setting">${esc(name)}<span class="val">${esc(val)}</span></div>`).join("")}
			${m.key ? `<h4>Клавиша</h4><div class="setting">Открыть меню<span class="val"><span class="kbd">${m.key}</span></span></div>` : `<h4>Клавиша</h4><div class="setting">Бинд для вкл/выкл<span class="val">Любая клавиша</span></div>`}`;
		$("#drawer-foot").innerHTML = m.free
			? `<div class="profile-card" style="margin:0"><span class="badge badge-free">FREE</span><span class="muted" style="font-size:14px">Доступен всем, без ключа</span></div>`
			: `<a class="btn btn-primary btn-block" href="pricing.html">${SKI.icons.lock.replace("<svg", '<svg width="18" height="18"')} Открыть с Pro — <span>${SKI.config.price} ${SKI.config.currency}/мес</span></a>`;
		document.body.classList.add("drawer-open");
		drawer.setAttribute("aria-hidden", "false");
		document.querySelectorAll("#drawer-body > *").forEach((el, i) => {
			el.animate([{ opacity: 0, transform: "translateX(16px)" }, { opacity: 1, transform: "none" }],
				{ duration: 380, delay: 120 + i * 40, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" });
		});
		$("#drawer-close").focus();
	}
	function closeDrawer() {
		document.body.classList.remove("drawer-open");
		drawer.setAttribute("aria-hidden", "true");
		lastFocus?.focus();
	}
	$("#drawer-close").addEventListener("click", closeDrawer);
	$("#drawer-backdrop").addEventListener("click", closeDrawer);
	addEventListener("keydown", e => { if (e.key === "Escape" && document.body.classList.contains("drawer-open")) closeDrawer(); });

	/* ---------------------------------------------------------------- crosshair playground */
	const canvas = $("#crosshair");
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	const colors = ["#2EA8F0", "#FFFFFF", "#4ADE80", "#FACC15", "#F43F5E", "#B06CF8"];
	const ch = { style: "cross", size: 4, gap: 1.5, thick: 1, color: colors[0], outline: true, target: false };
	const TARGET = "#F43F5E";

	$("#ch-color").innerHTML = colors.map((c, i) => `<button style="--c:${c}" data-c="${c}" class="${i ? "" : "on"}" aria-label="Цвет ${c}"></button>`).join("");
	$("#ch-color").addEventListener("click", e => {
		const b = e.target.closest("[data-c]");
		if (!b) return;
		ch.color = b.dataset.c;
		$("#ch-color").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
		draw();
	});
	$("#ch-style").addEventListener("click", e => {
		const b = e.target.closest("[data-v]");
		if (!b) return;
		ch.style = b.dataset.v;
		$("#ch-style").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
		draw();
	});
	[["size", "ch-size", "o-size"], ["gap", "ch-gap", "o-gap"], ["thick", "ch-thick", "o-thick"]].forEach(([key, id, out]) => {
		const input = document.getElementById(id);
		const sync = () => {
			ch[key] = parseFloat(input.value);
			document.getElementById(out).textContent = input.value;
			input.style.setProperty("--p", `${(input.value - input.min) / (input.max - input.min) * 100}%`);
			draw();
		};
		input.addEventListener("input", sync);
		sync();
	});
	$("#ch-outline").addEventListener("click", e => {
		ch.outline = e.currentTarget.classList.toggle("on");
		e.currentTarget.setAttribute("aria-pressed", ch.outline);
		draw();
	});
	const view = $("#pg-view");
	view.addEventListener("pointerenter", () => { ch.target = true; draw(); });
	view.addEventListener("pointerleave", () => { ch.target = false; draw(); });

	function draw() {
		const S = 10; // one in-game GUI pixel on this canvas
		const W = canvas.width, c = W / 2;
		ctx.clearRect(0, 0, W, W);
		const color = ch.target ? TARGET : ch.color;
		const t = ch.thick * S, len = ch.size * S, gap = ch.gap * S;
		const rects = [];
		if (ch.style === "cross" || ch.style === "crossdot") {
			rects.push([c - t / 2, c - gap - len, t, len], [c - t / 2, c + gap, t, len], [c - gap - len, c - t / 2, len, t], [c + gap, c - t / 2, len, t]);
		}
		if (ch.style === "dot" || ch.style === "crossdot") rects.push([c - t / 2 - (ch.style === "dot" ? S / 2 : 0), c - t / 2 - (ch.style === "dot" ? S / 2 : 0), t + (ch.style === "dot" ? S : 0), t + (ch.style === "dot" ? S : 0)]);

		if (ch.style === "circle") {
			const r = gap + len / 2;
			if (ch.outline) { ctx.strokeStyle = "rgba(0,0,0,.85)"; ctx.lineWidth = t + S * .8; ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
			ctx.strokeStyle = color; ctx.lineWidth = t; ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
		} else {
			if (ch.outline) {
				ctx.fillStyle = "rgba(0,0,0,.85)";
				const o = S * .4;
				rects.forEach(([x, y, w, h]) => ctx.fillRect(x - o, y - o, w + o * 2, h + o * 2));
			}
			ctx.fillStyle = color;
			rects.forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));
		}
		ctx.shadowBlur = 0;
	}
	draw();
})();
