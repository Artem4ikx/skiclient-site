/* Pricing page: Free list, comparison table and the key activation demo. */
(() => {
	const SKI = window.SKI;
	const $ = sel => document.querySelector(sel);
	const yes = `<span class="yes">${SKI.icons.check}</span>`;
	const no = `<span class="no">${SKI.icons.cross}</span>`;
	const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
	const dash = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 12h12"/></svg>';

	const freeModules = SKI.modules.filter(m => m.free);
	$("#free-list").innerHTML = freeModules.map(m => `<li>${tick}<span>${m.name}</span></li>`).join("")
		+ `<li class="off">${dash}<span>Ещё ${SKI.modules.length - freeModules.length} модулей — только в Pro</span></li>`;

	$("#compare tbody").innerHTML = SKI.categories.map(cat => {
		const rows = SKI.modules.filter(m => m.cat === cat.id)
			.map(m => `<tr><td>${m.name}</td><td>${m.free ? yes : no}</td><td>${yes}</td></tr>`).join("");
		return `<tr class="group"><td colspan="3">${cat.name}</td></tr>${rows}`;
	}).join("");

	/* ---------------------------------------------------------------- key activation demo */
	const box = $("#license");
	const keyText = $("#key-text"), status = $("#key-status"), tag = $("#plan-tag"), sub = $("#key-sub"), btn = $("#key-btn");
	const KEY = "SKI-7QF2K-M9XTD-4HB8R";
	const wait = ms => new Promise(r => setTimeout(r, ms));
	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const until = new Date(Date.now() + 30 * 864e5).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

	const setFree = () => {
		keyText.textContent = "";
		status.className = "key-status";
		status.textContent = "Бесплатный план. Введите ключ, чтобы открыть все функции.";
		tag.className = "badge badge-free plan-tag";
		tag.textContent = "FREE";
		sub.textContent = `Free · ${freeModules.length} модулей`;
	};
	const setPro = () => {
		keyText.textContent = KEY;
		status.className = "key-status ok";
		status.textContent = `Pro активен до ${until}. Спасибо за поддержку!`;
		tag.className = "badge badge-pro plan-tag";
		tag.textContent = "PRO";
		sub.textContent = `Pro · осталось 30 дн.`;
	};

	if (reduceMotion) { setPro(); return; }

	let running = false, visible = false;
	new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible && !running) loop();
	}, { threshold: .4 }).observe(box);

	async function loop() {
		running = true;
		while (visible) {
			setFree();
			await wait(900);
			for (const ch of KEY) {
				keyText.textContent += ch;
				await wait(ch === "-" ? 140 : 55 + Math.random() * 50);
			}
			await wait(450);
			btn.animate([{ transform: "scale(1)" }, { transform: "scale(.96)" }, { transform: "scale(1)" }], { duration: 220 });
			status.className = "key-status";
			status.innerHTML = '<span class="spinner"></span> Проверка ключа...';
			await wait(1300);
			setPro();
			tag.animate([{ transform: "scale(.6)", opacity: 0 }, { transform: "scale(1.25)", opacity: 1 }, { transform: "scale(1)" }],
				{ duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" });
			const rgb = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
			box.animate([{ boxShadow: `0 0 0 0 rgba(${rgb}, 0)` }, { boxShadow: `0 0 60px 0 rgba(${rgb}, .35)` }, { boxShadow: `0 0 0 0 rgba(${rgb}, 0)` }],
				{ duration: 1400 });
			await wait(4200);
		}
		running = false;
	}
})();
