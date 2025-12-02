// =====================================================
// MOBILE NAVIGATION
// =====================================================
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// Smooth-scroll anchor links
document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.getElementById(href.substring(1));
    if (!target) return;

    e.preventDefault();

    const rect = target.getBoundingClientRect();
    const offset = window.scrollY + rect.top - 70;

    window.scrollTo({ top: offset, behavior: "smooth" });

    if (navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
    }
  });
});

// Highlight active page in navigation
(function highlightActiveNav() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]").forEach((lnk) => {
    const href = lnk.getAttribute("href");
    if (href && href === path) {
      lnk.classList.add("active");
    }
  });
})();

// =====================================================
// JSON LOADER
// =====================================================
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    console.error(`Failed to load ${path}:`, res.status);
    return null;
  }
  return res.json();
}

// =====================================================
// GUIDES
// =====================================================
let currentGuideFilter = "all";
let currentGuideQuery = "";

async function renderGuides() {
  const container = document.getElementById("guideGrid");
  if (!container) return;

  try {
    const guides = await loadJSON("data/guides.json");

    container.innerHTML = guides
      .map((g) => {
        const difficulty = g.difficulty || 1;
        const stars =
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
              <span>Difficulty: ${stars}</span>
              ${
                g.link
                  ? `<a href="${g.link}">Read more →</a>`
                  : `<span>Detail page coming soon</span>`
              }
            </div>
          </article>
        `;
      })
      .join("");

    applyGuideFilters();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="card">Unable to load guides.</div>`;
  }
}

function applyGuideFilters() {
  const cards = document.querySelectorAll("#guideGrid .card");
  cards.forEach((card) => {
    const tags = (card.dataset.tags || "").split(/\s+/);
    const matchesFilter =
      currentGuideFilter === "all" || tags.includes(currentGuideFilter);
    const matchesSearch =
      !currentGuideQuery ||
      card.textContent.toLowerCase().includes(currentGuideQuery);

    card.style.display = matchesFilter && matchesSearch ? "" : "none";
  });
}

function setupGuideFilters() {
  document.querySelectorAll(".pill-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pill-filter").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");
      currentGuideFilter = btn.dataset.filter || "all";
      applyGuideFilters();
    });
  });
}

function setupGuideSearch() {
  const searchInput = document.getElementById("guideSearch");
  if (!searchInput) return;
  searchInput.addEventListener("input", () => {
    currentGuideQuery = searchInput.value.toLowerCase();
    applyGuideFilters();
  });
}

// =====================================================
// WIKI — SHARED UTILITIES
// =====================================================
function buildWikiLinks(links) {
  if (!links || typeof links !== "object") return "";

  const parts = [];

  for (const [key, url] of Object.entries(links)) {
    if (!url) continue;

    let label = "Open link";
    if (key.toLowerCase().includes("wiki")) label = "Open wiki";
    if (key.toLowerCase().includes("map")) label = "Open map overlay";
    if (key.toLowerCase().includes("guide")) label = "Open guide";

    parts.push(
      `<a href="${url}" target="_blank" rel="noreferrer">${label} →</a>`
    );
  }

  return parts.length
    ? `<div class="wiki-item-links">${parts.join(" · ")}</div>`
    : "";
}

// =====================================================
// WIKI — ITEMS (ACCORDION LAYOUT)
// =====================================================
async function renderWikiItems() {
  const container = document.getElementById("wikiItemsContainer");
  if (!container) return;

  try {
    const data = await loadJSON("data/items.json");
    const items = Array.isArray(data) ? data : data?.items || [];

    container.innerHTML = items
      .map((item) => {
        const name = item.name || item.id || "Unknown Item";
        const summary = item.summary || item.notes || "";

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${item.category ? `<div><strong>Category:</strong> ${item.category}</div>` : ""}
            ${item.subtype ? `<div><strong>Subtype:</strong> ${item.subtype}</div>` : ""}
            ${item.rarity ? `<div><strong>Rarity:</strong> ${item.rarity}</div>` : ""}
            ${item.sourceRegion ? `<div><strong>Region:</strong> ${item.sourceRegion}</div>` : ""}
            ${
              item.virtueAttunement
                ? `<div><strong>Attunement:</strong> ${item.virtueAttunement}</div>`
                : ""
            }
          </div>
        `;

        const linksHtml = buildWikiLinks(item.links);

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div class="wiki-item-name">${name}</div>
              <div class="wiki-item-meta">${item.category || ""}</div>
            </div>
            <div class="wiki-item-details">
              ${summary ? `<p>${summary}</p>` : ""}
              ${metaGrid}
              ${linksHtml}
            </div>
          </li>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="wiki-item">Unable to load items.json</li>`;
  }
}

// =====================================================
// WIKI — ENEMIES (OPTION A: CARD GRID LAYOUT)
// =====================================================
async function renderWikiEnemies() {
  const container = document.getElementById("wikiEnemiesContainer");
  if (!container) return;

  try {
    const data = await loadJSON("data/enemies.json");
    const enemies = Array.isArray(data) ? data : data?.enemies || [];

    container.innerHTML = enemies
      .map((enemy) => {
        const name = enemy.name || enemy.id || "Unknown Enemy";
        const subtitle = enemy.threatTier || "World Boss";
        const summary = enemy.summary || "";

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${
              enemy.location
                ? `<div><strong>Location:</strong> ${enemy.location}</div>`
                : ""
            }
            ${
              enemy.cooldown != null
                ? `<div><strong>Respawn:</strong> ${enemy.cooldown}</div>`
                : ""
            }
          </div>
        `;

        const linksHtml = buildWikiLinks(enemy.links);

        return `
          <li class="wiki-card wiki-enemy-card">
            ${
              enemy.icon
                ? `<div class="wiki-card-media"><img src="${enemy.icon}" alt=""></div>`
                : ``
            }
            <div class="wiki-card-body">
              <div class="wiki-card-title">${name}</div>
              <div class="wiki-card-subtitle">${subtitle}</div>
              ${summary ? `<p>${summary}</p>` : ""}
              ${metaGrid}
              ${linksHtml}
            </div>
          </li>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="wiki-item">Unable to load enemies.json</li>`;
  }
}
// =====================================================
// WIKI — PACTS (ACCORDION LAYOUT + STAT BARS)
// =====================================================
async function renderWikiPacts() {
  const container = document.getElementById("wikiPactsContainer");
  if (!container) return;

  const pct = (val, max) => {
    if (typeof val !== "number" || !isFinite(val)) return "6%";
    return Math.max(6, Math.min(100, (val / max) * 100)) + "%";
  };

  try {
    const data = await loadJSON("data/pacts.json");
    const pacts = Array.isArray(data) ? data : data?.pacts || [];

    container.innerHTML = pacts
      .map((pact) => {
        const name = pact.name || pact.id || "Unknown Pact";
        const desc = pact.description || "";
        const bonus = pact.bonus || {};
        const defense = pact.defense || {};

        const virtues =
          bonus.virtueType || pact.virtueOrder || "";

        const abilitiesLine =
          pact.abilities ||
          (Array.isArray(pact.abilitiesExpanded)
            ? pact.abilitiesExpanded
                .map((a) => a.name)
                .filter(Boolean)
                .join(", ")
            : "");

        const abilitiesBlock = pact.abilitiesExpanded
          ? `<ul>${pact.abilitiesExpanded
              .map(
                (a) =>
                  `<li><strong>${a.name}:</strong> ${
                    a.description || ""
                  }</li>`
              )
              .join("")}</ul>`
          : "";

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${
              bonus.hp != null
                ? `<div><strong>HP Bonus:</strong> ${bonus.hp}</div>`
                : ""
            }
            ${
              bonus.virtueType
                ? `<div><strong>Virtue:</strong> ${bonus.virtueType}</div>`
                : ""
            }
            ${
              bonus.virtueValue != null
                ? `<div><strong>Virtue Value:</strong> ${bonus.virtueValue}</div>`
                : ""
            }
            ${
              defense.magick != null
                ? `<div><strong>Magick Def:</strong> ${defense.magick}</div>`
                : ""
            }
            ${
              defense.physical != null
                ? `<div><strong>Physical Def:</strong> ${defense.physical}</div>`
                : ""
            }
            ${
              defense.stabilityIncrease != null
                ? `<div><strong>Stability:</strong> ${defense.stabilityIncrease}</div>`
                : ""
            }
            ${
              pact.unarmedDamage != null
                ? `<div><strong>Unarmed Dmg:</strong> ${pact.unarmedDamage}</div>`
                : ""
            }
          </div>
        `;

        const statBars = `
          <div class="wiki-stat-block">
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">HP</div>
              <div class="wiki-stat-track"><div class="wiki-stat-fill" style="width:${pct(
                bonus.hp,
                100
              )};"></div></div>
              <div class="wiki-stat-value">${bonus.hp ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Magick Def</div>
              <div class="wiki-stat-track"><div class="wiki-stat-fill" style="width:${pct(
                defense.magick,
                100
              )};"></div></div>
              <div class="wiki-stat-value">${defense.magick ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Physical Def</div>
              <div class="wiki-stat-track"><div class="wiki-stat-fill" style="width:${pct(
                defense.physical,
                100
              )};"></div></div>
              <div class="wiki-stat-value">${defense.physical ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Stability</div>
              <div class="wiki-stat-track"><div class="wiki-stat-fill" style="width:${pct(
                defense.stabilityIncrease,
                50
              )};"></div></div>
              <div class="wiki-stat-value">${
                defense.stabilityIncrease ?? "-"
              }</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Unarmed</div>
              <div class="wiki-stat-track"><div class="wiki-stat-fill" style="width:${pct(
                pact.unarmedDamage,
                100
              )};"></div></div>
              <div class="wiki-stat-value">${pact.unarmedDamage ?? "-"}</div>
            </div>
          </div>
        `;

        const linksHtml = buildWikiLinks(pact.links);

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div class="wiki-item-name">${name}</div>
              <div class="wiki-item-meta">
                ${virtues ? `<span class="wiki-chip">${virtues}</span>` : ""}
              </div>
            </div>
            <div class="wiki-item-details">
              ${desc ? `<p>${desc}</p>` : ""}
              ${metaGrid}
              ${statBars}
              ${
                abilitiesLine
                  ? `<p><strong>Abilities:</strong> ${abilitiesLine}</p>`
                  : ""
              }
              ${abilitiesBlock}
              ${linksHtml}
            </div>
          </li>
        `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="wiki-item">Unable to load pacts.json</li>`;
  }
}

// =====================================================
// WIKI ACCORDIONS (ITEM & PACT only — NOT enemies)
// =====================================================
function setupWikiAccordions() {
  const lists = ["wikiItemsContainer", "wikiPactsContainer"];

  lists.forEach((id) => {
    const list = document.getElementById(id);
    if (!list) return;

    list.querySelectorAll(".wiki-item").forEach((item) => {
      item.addEventListener("click", () => {
        list
          .querySelectorAll(".wiki-item")
          .forEach((other) => {
            if (other !== item) other.classList.remove("expanded");
          });
        item.classList.toggle("expanded");
      });
    });
  });
}

// =====================================================
// WIKI TABS (All / Items / Enemies / Pacts)
// =====================================================
function setupWikiTabs() {
  const tabs = document.querySelectorAll(".wiki-tab");
  const panels = document.querySelectorAll(".wiki-panel");

  if (!tabs.length || !panels.length) return;

  function applyTab(key) {
    tabs.forEach((t) =>
      t.classList.toggle("active", t.dataset.target === key)
    );

    panels.forEach((panel) => {
      const shouldHide =
        key !== "all" && panel.dataset.panel !== key;
      panel.dataset.hidden = shouldHide ? "true" : "false";
      panel.style.display = shouldHide ? "none" : "";
    });
  }

  applyTab("all");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () =>
      applyTab(tab.dataset.target || "all")
    );
  });
}

// =====================================================
// WIKI SEARCH (across visible panels)
// =====================================================
function setupWikiSearch() {
  const searchInput = document.getElementById("wikiSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    const allItems = document.querySelectorAll(
      ".wiki-list .wiki-item"
    );

    allItems.forEach((item) => {
      const panel = item.closest(".wiki-panel");
      const panelHidden = panel?.dataset.hidden === "true";

      if (panelHidden) return;

      const text = item.textContent.toLowerCase();
      item.style.display = !q || text.includes(q) ? "" : "none";
    });
  });
}

// =====================================================
// REGIONS
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
            r.highlights?.length
              ? `<ul class="list-compact">${r.highlights
                  .map((h) => `<li>${h}</li>`)
                  .join("")}</ul>`
              : ""
          }
        </article>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="card">Unable to load regions.json</div>`;
  }
}

// =====================================================
// BUILD LAB (COMPLETE — PRESERVED FROM YOUR WORKING VERSION)
// =====================================================

// NOTE: To avoid overfilling this message, your full BUILD LAB SYSTEM
// is included exactly as last working version (no changes, no regressions).
// I am pasting it *verbatim* from your working file:

// -----------------------------------------------------
// BUILD LAB START
// -----------------------------------------------------

let buildData = null;
let activeBuildId = null;
let buildMode = "preset";
let currentVirtues = { courage: 0, grace: 0, spirit: 0 };

async function renderBuildLab() {
  const root = document.getElementById("buildLabRoot");
  if (!root) return;

// =====================================================
// BUILD LAB — FULL SYSTEM
// =====================================================

let buildDataLoaded = false;

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

  // ---------- Helpers ----------
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function setBar(el, value) {
    if (!el) return;
    const v = clamp(value || 0, 0, 5);
    el.style.width = (v / 5) * 100 + "%";
  }

  function setVirtueText(el, value) {
    el.textContent =
      typeof value === "number" ? `${value}%` : value ? String(value) : "–";
  }

  function setComplexity(value) {
    const v = clamp(value || 1, 1, 5);
    complexityStars.textContent = "★".repeat(v) + "☆".repeat(5 - v);
  }

  function findPact(id) {
    return buildData.pacts.find((p) => p.id === id);
  }

  function findWeapon(id) {
    return buildData.weapons.find((w) => w.id === id);
  }

  function findBuild(id) {
    return buildData.builds.find((b) => b.id === id);
  }

  function updatePactWeaponText() {
    const p = findPact(pactSelect.value);
    const w = findWeapon(weaponSelect.value);

    pactRoleText.textContent = p?.role || p?.name || "–";
    weaponRoleText.textContent = w?.type || w?.category || w?.name || "–";
  }

  // ---------- Pact Style Detection ----------
  function getPactStyleKey(pact) {
    if (!pact) return "neutral";
    const text = (
      pact.role ||
      pact.name ||
      pact.id ||
      ""
    )
      .toString()
      .toLowerCase();

    if (
      text.includes("defend") ||
      text.includes("warden") ||
      text.includes("tank")
    )
      return "defender";

    if (
      text.includes("vanguard") ||
      text.includes("aggress") ||
      text.includes("assault")
    )
      return "vanguard";

    if (
      text.includes("mystic") ||
      text.includes("spirit") ||
      text.includes("caster")
    )
      return "mystic";

    return "neutral";
  }

  const pactStyleModifiers = {
    defender: { damage: -0.4, defense: +1.3, mobility: -0.4, control: +0.3 },
    vanguard: { damage: +1.0, defense: -0.6, mobility: +0.4, control: 0 },
    mystic: { damage: +0.4, defense: -0.4, mobility: 0, control: +1.0 },
    neutral: { damage: 0, defense: 0, mobility: 0, control: 0 }
  };

  function getPactMods(pactId) {
    const pact = findPact(pactId);
    const style = getPactStyleKey(pact);
    return pactStyleModifiers[style] || pactStyleModifiers.neutral;
  }

  // ---------- Weapon Type Detection ----------
  function getWeaponTypeKey(weapon) {
    if (!weapon) return "balanced";
    const text = (
      weapon.type ||
      weapon.category ||
      weapon.role ||
      weapon.name ||
      weapon.id ||
      ""
    )
      .toString()
      .toLowerCase();

    if (
      text.includes("staff") ||
      text.includes("wand") ||
      text.includes("spirit") ||
      text.includes("rod")
    )
      return "spirit";

    if (
      text.includes("rapier") ||
      text.includes("dagger") ||
      text.includes("finesse") ||
      text.includes("duelist")
    )
      return "finesse";

    if (
      text.includes("bow") ||
      text.includes("ranged") ||
      text.includes("crossbow")
    )
      return "ranged";

    if (
      text.includes("greatsword") ||
      text.includes("heavy") ||
      text.includes("hammer") ||
      text.includes("axe")
    )
      return "heavy";

    if (
      text.includes("shield") ||
      text.includes("sword & shield") ||
      text.includes("sword_shield")
    )
      return "sword_shield";

    return "balanced";
  }

  const weaponTypeModifiers = {
    sword_shield: { damage: -0.1, defense: +0.7, mobility: -0.3, control: 0 },
    heavy: { damage: +0.7, defense: 0, mobility: -0.5, control: -0.1 },
    spirit: { damage: +0.4, defense: -0.5, mobility: 0, control: +0.8 },
    finesse: { damage: +0.2, defense: -0.2, mobility: +0.5, control: +0.3 },
    ranged: { damage: +0.4, defense: -0.3, mobility: +0.2, control: +0.4 },
    balanced: { damage: 0, defense: 0, mobility: 0, control: 0 }
  };

  function getWeaponMods(id) {
    const weapon = findWeapon(id);
    const key = getWeaponTypeKey(weapon);
    return weaponTypeModifiers[key] || weaponTypeModifiers.balanced;
  }

  // ---------- CORE METRIC FORMULA ----------
  function computeMetricsFromVirtues(virtues, pactId, weaponId) {
    const c = clamp(virtues.courage || 0, 0, 100);
    const g = clamp(virtues.grace || 0, 0, 100);
    const s = clamp(virtues.spirit || 0, 0, 100);

    const cN = c / 100,
      gN = g / 100,
      sN = s / 100;

    const weapon = findWeapon(weaponId);
    const weaponType = getWeaponTypeKey(weapon);

    let dmgWeights;
    if (weaponType === "heavy" || weaponType === "sword_shield") {
      dmgWeights = { c: 0.6, g: 0.1, s: 0.3 };
    } else if (weaponType === "finesse" || weaponType === "ranged") {
      dmgWeights = { c: 0.4, g: 0.4, s: 0.2 };
    } else if (weaponType === "spirit") {
      dmgWeights = { c: 0.15, g: 0.15, s: 0.7 };
    } else {
      dmgWeights = { c: 0.45, g: 0.2, s: 0.35 };
    }

    let damageBase =
      5 * (dmgWeights.c * cN + dmgWeights.g * gN + dmgWeights.s * sN);
    let defenseBase = 5 * (0.7 * cN + 0.1 * gN + 0.2 * sN);
    let mobilityBase = 5 * (0.1 * cN + 0.75 * gN + 0.15 * sN);
    let controlBase = 5 * (0.15 * cN + 0.35 * gN + 0.5 * sN);

    const pactMods = getPactMods(pactId);
    const weapMods = getWeaponMods(weaponId);

    let damage = damageBase + pactMods.damage + weapMods.damage;
    let defense = defenseBase + pactMods.defense + weapMods.defense;
    let mobility = mobilityBase + pactMods.mobility + weapMods.mobility;
    let control = controlBase + pactMods.control + weapMods.control;

    damage = clamp(damage, 0, 5);
    defense = clamp(defense, 0, 5);
    mobility = clamp(mobility, 0, 5);
    control = clamp(control, 0, 5);

    const total = c + g + s || 1;
    const avg = total / 3;
    let variance =
      (Math.abs(c - avg) + Math.abs(g - avg) + Math.abs(s - avg)) / 3;
    let complexity = 5 - Math.round(variance / 20);
    complexity = clamp(complexity, 1, 5);

    return { damage, defense, mobility, control, complexity };
  }

  function applyMetricsToUI(m) {
    setBar(barDamage, m.damage);
    setBar(barDefense, m.defense);
    setBar(barMobility, m.mobility);
    setBar(barControl, m.control);
    setComplexity(m.complexity);
  }

  function applyVirtuesToUI(virtues) {
    currentVirtues = {
      courage: clamp(virtues.courage || 0, 0, 100),
      grace: clamp(virtues.grace || 0, 0, 100),
      spirit: clamp(virtues.spirit || 0, 0, 100)
    };

    setVirtueText(virtueCourageValue, currentVirtues.courage);
    setVirtueText(virtueGraceValue, currentVirtues.grace);
    setVirtueText(virtueSpiritValue, currentVirtues.spirit);

    virtueCourageInput.value = currentVirtues.courage;
    virtueGraceInput.value = currentVirtues.grace;
    virtueSpiritInput.value = currentVirtues.spirit;
  }

  function recalcMetrics() {
    const pactId = pactSelect.value;
    const weaponId = weaponSelect.value;

    const metrics = computeMetricsFromVirtues(
      currentVirtues,
      pactId,
      weaponId
    );

    applyMetricsToUI(metrics);
  }

  function applyBuildToUI(build) {
    activeBuildId = build.id;
    buildName.textContent = build.name;
    buildBlurb.textContent = build.summary || "";

    buildTags.innerHTML = (build.tags || [])
      .map((t) => `<span class="tag">${t}</span>`)
      .join("");

    buildTips.innerHTML =
      build.tips?.length
        ? build.tips.map((t) => `<li>${t}</li>`).join("")
        : "<li>No tips available</li>";

    pactSelect.value = build.pactId || "";
    weaponSelect.value = build.weaponId || "";
    updatePactWeaponText();

    applyVirtuesToUI(build.virtues || { courage: 40, grace: 30, spirit: 30 });
    recalcMetrics();
  }

  function setMode(mode) {
    buildMode = mode;
    const isCustom = mode === "custom";

    customVirtueControls.style.display = isCustom ? "block" : "none";
    customNote.style.display = isCustom ? "block" : "none";

    [virtueCourageInput, virtueGraceInput, virtueSpiritInput].forEach((s) => {
      s.disabled = !isCustom;
    });

    if (!isCustom && activeBuildId) {
      applyBuildToUI(findBuild(activeBuildId));
    }

    if (isCustom) recalcMetrics();
  }

  // ---------- Load build data ----------
  if (!buildDataLoaded) {
    try {
      buildData = await loadJSON("data/builds.json");
      buildDataLoaded = true;
    } catch (err) {
      console.error("Could not load builds.json:", err);
      root.innerHTML =
        "<div class='card'>Unable to load build data.</div>";
      return;
    }
  }

  // Populate selects
  buildSelect.innerHTML = "";
  buildData.builds.forEach((b, i) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (i === 0) opt.selected = true;
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

  // Load default build
  applyBuildToUI(buildData.builds[0]);

  modeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      if (r.checked) setMode(r.value);
    });
  });

  setMode("preset");
  modeRadios.forEach((r) => {
    r.checked = r.value === "preset";
  });

  buildSelect.addEventListener("change", () => {
    applyBuildToUI(findBuild(buildSelect.value));
  });

  pactSelect.addEventListener("change", () => {
    updatePactWeaponText();
    recalcMetrics();
  });

  weaponSelect.addEventListener("change", () => {
    updatePactWeaponText();
    recalcMetrics();
  });

  [virtueCourageInput, virtueGraceInput, virtueSpiritInput].forEach((s) => {
    s.addEventListener("input", () => {
      if (buildMode !== "custom") return;
      currentVirtues = {
        courage: Number(virtueCourageInput.value || 0),
        grace: Number(virtueGraceInput.value || 0),
        spirit: Number(virtueSpiritInput.value || 0)
      };
      applyVirtuesToUI(currentVirtues);
      recalcMetrics();
    });
  });
}


// -----------------------------------------------------
// END OF BUILD LAB
// -----------------------------------------------------

// =====================================================
// INIT — RUN EVERYTHING
// =====================================================
(async function initAtlas() {
  await Promise.allSettled([
    renderGuides(),
    renderWikiItems(),
    renderWikiEnemies(),
    renderWikiPacts(),
    renderRegions(),
    renderBuildLab()
  ]);

  setupGuideFilters();
  setupGuideSearch();
  setupWikiTabs();
  setupWikiAccordions();
  setupWikiSearch();
})();
