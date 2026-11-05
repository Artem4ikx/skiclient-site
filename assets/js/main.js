/* Shared behaviour for every page: theme, header, reveal, snow, counters, tilt, config fill-ins. */
(() => {
	const SKI = window.SKI;
	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

	const store = {
		get(key) { try { return localStorage.getItem(key); } catch { return null; } },
		set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
	};

	SKI.icons = {
		eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
		hud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M6 8h4M6 11h2M8 21h8"/></svg>',
		gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/></svg>',
		globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
		user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4M16 11l2 2 4-4"/></svg>',
		grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
		check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
		cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
		lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
	};

	/* ---------------------------------------------------------------- theme */
	const themeById = id => SKI.themes.find(t => t.id === id) || SKI.themes[0];
	const listeners = [];
	SKI.onTheme = fn => { listeners.push(fn); fn(themeById(document.documentElement.dataset.theme)); };
	SKI.setTheme = id => {
		const theme = themeById(id);
		document.documentElement.dataset.theme = theme.id;
		store.set("ski-theme", theme.id);
		document.querySelectorAll("[data-set-theme]").forEach(el => el.classList.toggle("on", el.dataset.setTheme === theme.id));
		document.querySelectorAll("[data-theme-name]").forEach(el => { el.textContent = theme.name; });
		listeners.forEach(fn => fn(theme));
	};

	// Swatch pickers are rendered from data so every page stays in sync with Theme.java
	document.querySelectorAll("[data-theme-swatches]").forEach(box => {
		box.insertAdjacentHTML("beforeend", SKI.themes.map(t =>
			`<button class="swatch" style="--c:${t.color}" data-set-theme="${t.id}" aria-label="Тема ${t.name}" title="${t.name}"></button>`).join(""));
	});
	document.querySelectorAll("[data-theme-list]").forEach(box => {
		box.innerHTML = SKI.themes.map(t =>
			`<button class="theme-row" style="--c:${t.color}" data-set-theme="${t.id}"><i></i><b>${t.name}</b><span>${t.color}</span></button>`).join("");
	});
	document.addEventListener("click", e => {
		const btn = e.target.closest("[data-set-theme]");
		if (btn) SKI.setTheme(btn.dataset.setTheme);
	});
	SKI.setTheme(document.documentElement.dataset.theme || store.get("ski-theme") || "sky");

	/* ---------------------------------------------------------------- config fill-ins */
	const cfg = SKI.config;
	const freeCount = SKI.modules.filter(m => m.free).length;
	const values = {
		version: cfg.version, minecraft: cfg.minecraft, loader: cfg.loader, price: cfg.price, currency: cfg.currency,
		jarSize: cfg.jarSize, modules: SKI.modules.length, free: freeCount, pro: SKI.modules.length - freeCount,
	};
	document.querySelectorAll("[data-cfg]").forEach(el => { el.textContent = values[el.dataset.cfg]; });
	document.querySelectorAll("[data-link]").forEach(el => {
		const map = { buy: cfg.buyUrl, discord: cfg.discordUrl, telegram: cfg.telegramUrl, jar: cfg.jar };
		el.href = map[el.dataset.link];
		if (el.dataset.link !== "jar") { el.target = "_blank"; el.rel = "noopener"; }
	});
	document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });

	/* ---------------------------------------------------------------- header */
	const header = document.querySelector(".header");
	if (header) {
		const onScroll = () => header.classList.toggle("scrolled", scrollY > 10);
		addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		header.querySelector(".burger")?.addEventListener("click", () => {
			const open = header.classList.toggle("open");
			header.querySelector(".burger").setAttribute("aria-expanded", open);
		});
		const page = document.body.dataset.page;
		header.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.nav === page));
	}

	/* ---------------------------------------------------------------- split headline */
	document.querySelectorAll("[data-split]").forEach(el => {
		let i = 0;
		const walk = node => {
			[...node.childNodes].forEach(child => {
				if (child.nodeType === 3) {
					const frag = document.createDocumentFragment();
					child.textContent.split(/(\s+)/).forEach(part => {
						if (!part) return;
						if (/^\s+$/.test(part)) { frag.append(part); return; }
						const w = document.createElement("span");
						w.className = "w";
						w.innerHTML = `<span style="--i:${i++}">${part}</span>`;
						frag.append(w);
					});
					child.replaceWith(frag);
				} else if (child.nodeType === 1 && child.classList.contains("grad")) {
					// background-clip text breaks on transformed children, so a gradient phrase rises as one piece
					const w = document.createElement("span");
					w.className = "w";
					const inner = document.createElement("span");
					inner.style.setProperty("--i", i++);
					child.replaceWith(w);
					inner.append(child);
					w.append(inner);
				} else if (child.nodeType === 1 && child.tagName !== "BR") {
					walk(child);
				}
			});
		};
		walk(el);
		el.classList.add("split");
	});

	/* ---------------------------------------------------------------- reveal */
	const revealIo = new IntersectionObserver(entries => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add("in");
				revealIo.unobserve(entry.target);
			}
		});
	}, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
	SKI.reveal = root => (root || document).querySelectorAll(".reveal:not(.in)").forEach(el => revealIo.observe(el));
	document.querySelectorAll("[data-stagger]").forEach(group => {
		const step = parseFloat(group.dataset.stagger) || .08;
		[...group.children].forEach((child, i) => {
			child.classList.add("reveal");
			child.style.setProperty("--d", `${i * step}s`);
		});
	});
	SKI.reveal();

	/* ---------------------------------------------------------------- counters */
	const countIo = new IntersectionObserver(entries => {
		entries.forEach(entry => {
			if (!entry.isIntersecting) return;
			countIo.unobserve(entry.target);
			const el = entry.target;
			const target = parseFloat(el.dataset.count);
			const suffix = el.dataset.suffix || "";
			if (reduceMotion) { el.textContent = target + suffix; return; }
			const start = performance.now();
			const tick = now => {
				const t = Math.min(1, (now - start) / 1600);
				const eased = 1 - Math.pow(1 - t, 4);
				el.textContent = Math.round(target * eased) + suffix;
				if (t < 1) requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
	}, { threshold: .5 });
	document.querySelectorAll("[data-count]").forEach(el => countIo.observe(el));

	/* ---------------------------------------------------------------- cursor glow on cards */
	document.addEventListener("pointermove", e => {
		const card = e.target.closest?.(".glow-card");
		if (!card) return;
		const r = card.getBoundingClientRect();
		card.style.setProperty("--mx", `${e.clientX - r.left}px`);
		card.style.setProperty("--my", `${e.clientY - r.top}px`);
	}, { passive: true });

	/* ---------------------------------------------------------------- client-style toggles */
	document.addEventListener("click", e => {
		const t = e.target.closest(".toggle[data-demo]");
		if (!t) return;
		t.classList.toggle("on");
		t.closest(".mini-card")?.classList.toggle("on", t.classList.contains("on"));
		t.setAttribute("aria-pressed", t.classList.contains("on"));
	});

	/* ---------------------------------------------------------------- FAQ: one answer open at a time, eased in */
	document.querySelectorAll("details.qa").forEach(d => d.addEventListener("toggle", () => {
		if (!d.open) return;
		document.querySelectorAll("details.qa[open]").forEach(other => { if (other !== d) other.open = false; });
		if (!reduceMotion) {
			d.querySelector(".answer")?.animate([{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }],
				{ duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
		}
	}));

	/* ---------------------------------------------------------------- toast */
	let toastTimer;
	SKI.toast = text => {
		let el = document.querySelector(".toast");
		if (!el) {
			el = document.createElement("div");
			el.className = "toast";
			el.setAttribute("role", "status");
			el.innerHTML = "<i></i><span></span>";
			document.body.append(el);
		}
		el.querySelector("span").textContent = text;
		requestAnimationFrame(() => el.classList.add("show"));
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
	};

	/* ---------------------------------------------------------------- screenshot showcase */
	document.querySelectorAll("[data-showcase]").forEach(box => {
		const screen = box.querySelector(".showcase-screen");
		const shots = [...new Set(SKI.themes.map(t => t.shot))];
		screen.innerHTML = shots.map(s =>
			`<img src="assets/img/gui-${s}.webp" srcset="assets/img/gui-${s}-960.webp 960w, assets/img/gui-${s}.webp 1920w" sizes="(max-width: 1020px) 100vw, 1150px" alt="Меню SkiClient в теме ${s}" data-shot="${s}" width="1920" height="1080" ${s === "sky" ? "" : 'loading="lazy"'}>`).join("");
		SKI.onTheme(theme => screen.querySelectorAll("img").forEach(img => img.classList.toggle("on", img.dataset.shot === theme.shot)));

		const frame = box.querySelector(".showcase-frame");
		if (reduceMotion || !frame) return;
		// The frame lies back in 3D and straightens up as it scrolls into view; the mouse tilts it a little.
		let rx = 12, ry = 0, sc = .96, mx = 0, my = 0, ticking = false;
		const apply = () => {
			ticking = false;
			frame.style.setProperty("--rx", `${(rx + my).toFixed(2)}deg`);
			frame.style.setProperty("--ry", `${mx.toFixed(2)}deg`);
			frame.style.setProperty("--sc", sc.toFixed(3));
		};
		const queue = () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } };
		const onScroll = () => {
			const r = box.getBoundingClientRect();
			const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .9)));
			rx = 14 * (1 - p);
			sc = .94 + .06 * p;
			queue();
		};
		addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		box.addEventListener("pointermove", e => {
			const r = box.getBoundingClientRect();
			mx = ((e.clientX - r.left) / r.width - .5) * 6;
			my = -((e.clientY - r.top) / r.height - .5) * 4;
			queue();
		});
		box.addEventListener("pointerleave", () => { mx = 0; my = 0; queue(); });
	});

	/* ---------------------------------------------------------------- snow */
	const canvas = document.getElementById("snow");
	if (canvas && !reduceMotion) {
		const ctx = canvas.getContext("2d");
		let w, h, dpr, flakes = [], color = "255,255,255";
		const resize = () => {
			dpr = Math.min(devicePixelRatio || 1, 2);
			w = canvas.width = innerWidth * dpr;
			h = canvas.height = innerHeight * dpr;
			const count = Math.round(Math.min(110, innerWidth / 14));
			flakes = Array.from({ length: count }, () => ({
				x: Math.random() * w, y: Math.random() * h,
				r: (Math.random() * 1.8 + .4) * dpr,
				s: (Math.random() * .5 + .25) * dpr,
				d: Math.random() * Math.PI * 2,
				a: Math.random() * .5 + .15,
				tint: Math.random() < .3,
			}));
		};
		SKI.onTheme(theme => {
			const hex = theme.color.slice(1);
			color = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)).join(",");
		});
		let mouseX = 0;
		addEventListener("pointermove", e => { mouseX = (e.clientX / innerWidth - .5) * 2; }, { passive: true });
		const frame = () => {
			ctx.clearRect(0, 0, w, h);
			for (const f of flakes) {
				f.d += .01;
				f.y += f.s;
				f.x += Math.sin(f.d) * .3 * dpr + mouseX * .4 * dpr;
				if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
				if (f.x > w + 5) f.x = -5;
				if (f.x < -5) f.x = w + 5;
				ctx.beginPath();
				ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(${f.tint ? color : "255,255,255"},${f.a})`;
				ctx.fill();
			}
			requestAnimationFrame(frame);
		};
		addEventListener("resize", resize);
		resize();
		requestAnimationFrame(frame);
	}
})();
