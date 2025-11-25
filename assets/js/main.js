// assets/js/main.js

// ------------------------
// Mobile nav toggle
// ------------------------
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// ------------------------
// Smooth scroll for same-page anchors
// ------------------------
document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const targetId = href.slice(1);
    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    const rect = target.getBoundingClientRect();
    const offset = window.pageYOffset || document.documentElement.scrollTop;
    const top = rect.top + offset - 70; // sticky header
    window.scrollTo({ top, behavior: "smooth" });

    if (navLinks && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
    }
  });
});

// ------------------------
// Highlight active nav link based on pathname
// ------------------------
(function highlightActiveNav() {
  const path = window.location.pathname;
  const links = document.querySelectorAll(".nav-links a[href]");
  const current = path.split("/").pop() || "index.html";

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const linkPath = href.replace(/^\//, "");

    if (current === linkPath || (!current && linkPath === "index.html")) {
      link.classList.add("active");
    }
  });
})();

// ------------------------
// JSON helper
// ------------------------
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    console.error(`Failed to load ${path}`, res.status);
    throw new Error(`Failed to load ${path}`);
  }
  return await res.json();
}

// =====================================================
// GUIDES: render + filter + search
// =====================================================

let currentGuideFilter = "all";
let currentGuideQuery = "";

async function renderGuides() {
  const container = document.getElementById("guideGrid");
  if (!container) return; // not on guides.html

  try {
    const guides = await loadJSON("data/guides.json");

    container.innerHTML = guides
      .map((g) => {
        const difficulty = g.difficulty || 1;
        const difficultyStars =
          "★".repeat(difficulty) + "☆".repeat(Math.max(0, 3 - difficulty));

        return `
          <article class="card" data-tags="${(g.tags || []).join(" ")}">
            <h3>${g.title}</h3>
            <p>${g.summary}</p>
            <div class="card-tag-row">
              ${(g.tags || [])
                .map((t) => `<span class="tag">${t}</span>`)
                .join("")}
            </div>
            <div class="card-footer">
              <span>Difficulty: ${difficultyStars}</span>
              ${
                g.link
                  ? `<a href="${g.link}">Read more →</a>`
                  : `<span>Detail page: coming soon</span>`
              }
            </div>
          </article>
        `;
      })
      .join("");

    applyGuideFilters();
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="card">
        <h3>Unable to load guides</h3>
        <p style="color: var(--muted);">
          Check <code>data/guides.json</code> exists and is valid JSON.
        </p>
      </div>
    `;
  }
}

function applyGuideFilters() {
  const cards = document.querySelectorAll("#guideGrid .card");
  if (!cards.length) return;

  cards.forEach((card) => {
    const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
    const text = (card.textContent || "").toLowerCase();

    const matchesFilter =
      currentGuideFilter === "all" || tags.includes(currentGuideFilter);
    const matchesSearch =
      !currentGuideQuery || text.includes(currentGuideQuery);

    card.style.display = matchesFilter && matchesSearch ? "" : "none";
  });
}

function setupGuideFilters() {
  const buttons = document.querySelectorAll(".pill-filter");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter") || "all";
      currentGuideFilter = filter;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      applyGuideFilters();
    });
  });
}

function setupGuideSearch() {
  const searchInput = document.getElementById("guideSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    currentGuideQuery = searchInput.value.toLowerCase().trim();
    applyGuideFilters();
  });
}

// =====================================================
// WIKI: items + enemies + accordions + search
// =====================================================

async function renderWikiItems() {
  const container = document.getElementById("wikiItemsContainer");
  if (!container) return;

  try {
    const items = await loadJSON("data/items.json");
    container.innerHTML = items
      .map((item) => {
        const linksHtml = item.links
          ? Object.values(item.links)
              .map(
                (url) =>
                  `<a href="${url}" target="_blank" rel="noreferrer">Full entry →</a>`
              )
              .join(" · ")
          : "";

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div class="wiki-item-name">${item.name}</div>
              <div class="wiki-item-meta">
                ${item.category || item.type || ""}
              </div>
            </div>
            <div class="wiki-item-details">
              ${item.description || ""}
              ${linksHtml ? "<br />" + linksHtml : ""}
            </div>
          </li>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <li class="wiki-item">
        <div class="wiki-item-header">
          <div class="wiki-item-name">Unable to load items</div>
          <div class="wiki-item-meta">Check data/items.json</div>
        </div>
      </li>
    `;
  }
}

async function renderWikiEnemies() {
  const container = document.getElementById("wikiEnemiesContainer");
  if (!container) return;

  try {
    const enemies = await loadJSON("data/enemies.json");
    container.innerHTML = enemies
      .map((enemy) => {
        const metaParts = [];
        if (enemy.faction) metaParts.push(enemy.faction);
        if (enemy.type) metaParts.push(enemy.type);
        const meta = metaParts.join(" · ");

        const linksHtml = enemy.links
          ? Object.values(enemy.links)
              .map(
                (url) =>
                  `<a href="${url}" target="_blank" rel="noreferrer">Full entry →</a>`
              )
              .join(" · ")
          : "";

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div class="wiki-item-name">${enemy.name}</div>
              <div class="wiki-item-meta">${meta}</div>
            </div>
            <div class="wiki-item-details">
              ${enemy.description || ""}
              ${linksHtml ? "<br />" + linksHtml : ""}
            </div>
          </li>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <li class="wiki-item">
        <div class="wiki-item-header">
          <div class="wiki-item-name">Unable to load enemies</div>
          <div class="wiki-item-meta">Check data/enemies.json</div>
        </div>
      </li>
    `;
  }
}

function setupWikiAccordions() {
  const wikiItems = document.querySelectorAll(".wiki-item");
  if (!wikiItems.length) return;

  wikiItems.forEach((item) => {
    item.addEventListener("click", () => {
      const parentList = item.parentElement;
      parentList
        .querySelectorAll(".wiki-item")
        .forEach((other) => {
          if (other !== item) other.classList.remove("expanded");
        });
      item.classList.toggle("expanded");
    });
  });
}

function setupWikiSearch() {
  const searchInput = document.getElementById("wikiSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    const allItems = document.querySelectorAll(
      "#wikiItemsContainer .wiki-item, #wikiEnemiesContainer .wiki-item"
    );

    allItems.forEach((item) => {
      const text = (item.textContent || "").toLowerCase();
      item.style.display = !query || text.includes(query) ? "" : "none";
    });
  });
}

// =====================================================
// REGIONS: render Region Overview
// =====================================================

async function renderRegions() {
  const container = document.getElementById("regionGrid");
  if (!container) return;

  try {
    const regions = await loadJSON("data/regions.json");
    container.innerHTML = regions
      .map(
        (r) => `
        <article class="card">
          <h3>${r.name}</h3>
          <p>${r.description}</p>
          <div class="card-tag-row">
            <span class="tag">${r.tier || "Region"}</span>
            <span class="tag">Threat: ${r.threat || "Unknown"}</span>
            ${
              r.recommendedLevel
                ? `<span class="tag">Lv. ${r.recommendedLevel}</span>`
                : ""
            }
          </div>
          ${
            r.highlights && r.highlights.length
              ? `<ul class="list-compact" style="margin-top:0.4rem;">
                  ${r.highlights.map((h) => `<li>${h}</li>`).join("")}
                 </ul>`
              : ""
          }
        </article>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="card">
        <h3>Unable to load regions</h3>
        <p style="color: var(--muted);">
          Check <code>data/regions.json</code> exists and is valid JSON.
        </p>
      </div>
    `;
  }
}

// =====================================================
// BUILD LAB: virtues drive derived stats + pact modifiers
// =====================================================

let buildData = null;
let activeBuildId = null;
let buildMode = "preset";
let currentVirtues = { courage: 0, grace: 0, spirit: 0 };

async function renderBuildLab() {
  const root = document.getElementById("buildLabRoot");
  if (!root) return; // not on build-lab.html

  // DOM refs
  const buildSelect = document.getElementById("buildSelect");
  const pactSelect = document.getElementById("pactSelect");
  const weaponSelect = document.getElementById("weaponSelect");

  const buildName = document.getElementById("buildName");
  const buildBlurb = document.getElementById("buildBlurb");
  const buildTags = document.getElementById("buildTags");
  const buildTips = document.getElementById("buildTips");

  const virtueCourageValue = document.getElementById("virtueCourageValue");
  const virtueGraceValue = document.getElementById("virtueGraceValue");
  const virtueSpiritValue = document.getElementById("virtueSpiritValue");

  const pactRoleText = document.getElementById("pactRoleText");
  const weaponRoleText = document.getElementById("weaponRoleText");

  const barDamage = document.getElementById("barDamage");
  const barDefense = document.getElementById("barDefense");
  const barMobility = document.getElementById("barMobility");
  const barControl = document.getElementById("barControl");
  const complexityStars = document.getElementById("complexityStars");

  const modeRadios = document.querySelectorAll("input[name='buildMode']");

  const virtueCourageInput = document.getElementById("virtueCourageInput");
  const virtueGraceInput = document.getElementById("virtueGraceInput");
  const virtueSpiritInput = document.getElementById("virtueSpiritInput");

  const customVirtueControls = document.getElementById("customVirtueControls");
  const customNote = document.getElementById("customNote");

  if (!buildSelect) {
    console.warn("Build Lab markup missing key elements.");
    return;
  }

  // ---------- helpers ----------
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function setBar(el, value) {
    if (!el) return;
    const v = clamp(value || 0, 0, 5);
    const pct = (v / 5) * 100;
    el.style.width = pct + "%";
  }

  function setVirtueText(el, value) {
    if (!el) return;
    el.textContent =
      typeof value === "number" ? `${value}%` : value ? String(value) : "–";
  }

  function setComplexity(value) {
    if (!complexityStars) return;
    const v = clamp(value || 1, 1, 5);
    complexityStars.textContent = "★".repeat(v) + "☆".repeat(5 - v);
  }

  function findPact(id) {
    return buildData && buildData.pacts.find((p) => p.id === id);
  }

  function findWeapon(id) {
    return buildData && buildData.weapons.find((w) => w.id === id);
  }

  function findBuild(id) {
    return buildData && buildData.builds.find((b) => b.id === id);
  }

  function updatePactWeaponText() {
    const p = findPact(pactSelect.value);
    const w = findWeapon(weaponSelect.value);

    if (pactRoleText) {
      pactRoleText.textContent = p ? `${p.name} – ${p.role}` : "–";
    }
    if (weaponRoleText) {
      weaponRoleText.textContent = w ? `${w.name} – ${w.role}` : "–";
    }
  }

  // Pact modifiers: tweak each stat a bit depending on the pact identity.
  // If IDs don't match, modifiers default to 0 and nothing breaks.
  const pactModifiers = {
    // Defensive / tanky pact: more defense, less mobility, slightly less damage
    defender: { damage: -0.4, defense: +1.2, mobility: -0.4, control: +0.2 },

    // Aggressive frontline: more damage & mobility, slightly less defense
    vanguard: { damage: +1.0, defense: -0.5, mobility: +0.5, control: 0 },

    // Spirit-heavy / caster pact: more damage & control, less raw defense
    mystic: { damage: +0.6, defense: -0.4, mobility: 0, control: +0.8 }
  };

  function getPactMods(pactId) {
    return pactModifiers[pactId] || {
      damage: 0,
      defense: 0,
      mobility: 0,
      control: 0
    };
  }

  // Core formula: derive stats from virtues + pact
  function computeMetricsFromVirtues(virtues, pactId) {
    const c = virtues.courage || 0; // Courage: physical resilience / aggression
    const g = virtues.grace || 0;   // Grace: mobility / finesse
    const s = virtues.spirit || 0;  // Spirit: magic / control

    // Base 0–5 values from 0–100 virtue percentages
    // (weights chosen to "feel" right rather than perfect math)
    let damageBase = 0.04 * c + 0.06 * s;          // Courage + strong Spirit
    let defenseBase = 0.06 * c + 0.02 * g;         // Courage heavy
    let mobilityBase = 0.055 * g + 0.015 * (100 - c); // Grace + low armor load
    let controlBase = 0.04 * s + 0.035 * g;        // Spirit + Grace

    // scale down into ~0–5 range
    const scale = 0.06;
    let damage = damageBase * scale;
    let defense = defenseBase * scale;
    let mobility = mobilityBase * scale;
    let control = controlBase * scale;

    // Pact modifiers
    const mods = getPactMods(pactId);
    damage += mods.damage || 0;
    defense += mods.defense || 0;
    mobility += mods.mobility || 0;
    control += mods.control || 0;

    // Clamp into 0–5 range
    damage = clamp(damage, 0, 5);
    defense = clamp(defense, 0, 5);
    mobility = clamp(mobility, 0, 5);
    control = clamp(control, 0, 5);

    // Complexity: rough measure of how "spread" the virtues are.
    // More even spread = higher complexity; extreme focus = simpler.
    const total = c + g + s || 1;
    const avg = total / 3;
    const variance =
      (Math.abs(c - avg) + Math.abs(g - avg) + Math.abs(s - avg)) / 3;
    // High variance => simple (1–2), low variance => complex (4–5)
    let complexity = 5 - Math.round(variance / 20); // crude but readable
    complexity = clamp(complexity, 1, 5);

    return { damage, defense, mobility, control, complexity };
  }

  function applyMetricsToUI(metrics) {
    if (!metrics) return;
    setBar(barDamage, metrics.damage);
    setBar(barDefense, metrics.defense);
    setBar(barMobility, metrics.mobility);
    setBar(barControl, metrics.control);
    setComplexity(metrics.complexity);
  }

  function applyVirtuesToUI(virtues) {
    currentVirtues = {
      courage: virtues.courage || 0,
      grace: virtues.grace || 0,
      spirit: virtues.spirit || 0
    };

    setVirtueText(virtueCourageValue, currentVirtues.courage);
    setVirtueText(virtueGraceValue, currentVirtues.grace);
    setVirtueText(virtueSpiritValue, currentVirtues.spirit);

    if (virtueCourageInput)
      virtueCourageInput.value = currentVirtues.courage;
    if (virtueGraceInput)
      virtueGraceInput.value = currentVirtues.grace;
    if (virtueSpiritInput)
      virtueSpiritInput.value = currentVirtues.spirit;
  }

  function recalcMetrics() {
    const pactId =
      pactSelect.value ||
      (activeBuildId && findBuild(activeBuildId)?.pactId) ||
      "";

    const metrics = computeMetricsFromVirtues(currentVirtues, pactId);
    applyMetricsToUI(metrics);
  }

  function applyBuildToUI(build) {
    if (!build) return;
    activeBuildId = build.id;

    // text / tags / tips
    buildName.textContent = build.name;
    buildBlurb.textContent = build.summary || "";

    if (buildTags) {
      buildTags.innerHTML = (build.tags || [])
        .map((t) => `<span class="tag">${t}</span>`)
        .join("");
    }

    if (buildTips) {
      const tips = build.tips || [];
      buildTips.innerHTML = tips.length
        ? tips.map((t) => `<li>${t}</li>`).join("")
        : `<li>No specific tips yet—experiment and adjust as you go.</li>`;
    }

    // pact / weapon selects
    if (build.pactId && findPact(build.pactId)) {
      pactSelect.value = build.pactId;
    }
    if (build.weaponId && findWeapon(build.weaponId)) {
      weaponSelect.value = build.weaponId;
    }
    updatePactWeaponText();

    // virtues from build JSON (falls back to a sensible default)
    const virtues = build.virtues || { courage: 40, grace: 30, spirit: 30 };
    applyVirtuesToUI(virtues);

    // metrics derived purely from virtues + pact
    recalcMetrics();
  }

  function setMode(newMode) {
    buildMode = newMode;
    const isCustom = newMode === "custom";

    if (customVirtueControls)
      customVirtueControls.style.display = isCustom ? "block" : "none";
    if (customNote) customNote.style.display = isCustom ? "block" : "none";

    // Enable / disable virtue sliders
    const sliders = [
      virtueCourageInput,
      virtueGraceInput,
      virtueSpiritInput
    ];
    sliders.forEach((s) => {
      if (s) s.disabled = !isCustom;
    });

    // Switching back to preset: reload virtues from build
    if (!isCustom && activeBuildId && buildData) {
      const b = findBuild(activeBuildId);
      if (b) applyBuildToUI(b);
    }

    // Switching to custom: keep current virtues but allow user to move them
    if (isCustom) {
      // Just recalc so bars reflect whatever's there
      recalcMetrics();
    }
  }

  // ---------- load data ----------
  try {
    buildData = await loadJSON("data/builds.json");
  } catch (err) {
    console.error(err);
    root.innerHTML = `
      <div class="card">
        <h3>Unable to load Build Lab data</h3>
        <p style="color: var(--muted);">
          Check <code>data/builds.json</code> exists and is valid JSON.
        </p>
      </div>
    `;
    return;
  }

  // Populate selects
  buildSelect.innerHTML = "";
  buildData.builds.forEach((b, idx) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (idx === 0) opt.selected = true;
    buildSelect.appendChild(opt);
  });

  pactSelect.innerHTML = "";
  buildData.pacts.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    pactSelect.appendChild(opt);
  });

  weaponSelect.innerHTML = "";
  buildData.weapons.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name;
    weaponSelect.appendChild(opt);
  });

  // Initial build
  if (buildData.builds.length > 0) {
    applyBuildToUI(buildData.builds[0]);
  }

  // Mode radios
  if (modeRadios && modeRadios.length) {
    modeRadios.forEach((r) => {
      r.addEventListener("change", () => {
        if (r.checked) setMode(r.value);
      });
    });
  }
  // default: preset
  setMode("preset");
  if (modeRadios && modeRadios.length) {
    modeRadios.forEach((r) => {
      r.checked = r.value === "preset";
    });
  }

  // Select changes
  buildSelect.addEventListener("change", () => {
    const b = findBuild(buildSelect.value);
    if (b) applyBuildToUI(b);
  });

  pactSelect.addEventListener("change", () => {
    updatePactWeaponText();
    recalcMetrics();
  });
  weaponSelect.addEventListener("change", () => {
    updatePactWeaponText();
    // weapon currently only affects description, but could feed into metrics later
  });

  // Virtue slider changes (only affect stats in Custom mode)
  const virtueSliders = [
    virtueCourageInput,
    virtueGraceInput,
    virtueSpiritInput
  ];
  virtueSliders.forEach((s) => {
    if (!s) return;
    s.addEventListener("input", () => {
      if (buildMode !== "custom") return;

      currentVirtues = {
        courage: Number(virtueCourageInput?.value || 0),
        grace: Number(virtueGraceInput?.value || 0),
        spirit: Number(virtueSpiritInput?.value || 0)
      };
      applyVirtuesToUI(currentVirtues);
      recalcMetrics();
    });
  });
}


// =====================================================
// Init
// =====================================================

(async function initAtlas() {
  await Promise.allSettled([
    renderGuides(),
    renderWikiItems(),
    renderWikiEnemies(),
    renderRegions(),
    renderBuildLab()
  ]);

  setupGuideFilters();
  setupGuideSearch();
  setupWikiAccordions();
  setupWikiSearch();
})();
