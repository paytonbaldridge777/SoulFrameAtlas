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
// WIKI: items + enemies + pacts + accordions + search + tabs
// =====================================================

// Helper: build link HTML, including map links
function buildWikiLinks(links, extraMapUrl) {
  const parts = [];

  if (links && typeof links === "object") {
    for (const [key, url] of Object.entries(links)) {
      if (!url) continue;
      const lower = key.toLowerCase();
      let label = "Open link";

      if (lower.includes("map")) label = "Open map overlay";
      else if (lower === "wiki") label = "Open wiki";
      else if (lower.includes("guide")) label = "Open guide";
      else if (lower.includes("external")) label = "Open external";

      parts.push(
        `<a href="${url}" target="_blank" rel="noreferrer">${label} →</a>`
      );
    }
  }

  // If there is a separate explicit map URL (e.g., mapLink / mapUrl)
  // if (extraMapUrl) {
    // parts.push(
      // `<a href="${extraMapUrl}" target="_blank" rel="noreferrer">Open map overlay →</a>`
    // );
  // }

  return parts.length ? `<div class="wiki-item-links">${parts.join(" · ")}</div>` : "";
}

async function renderWikiItems() {
  const container = document.getElementById("wikiItemsContainer");
  if (!container) return;

  try {
    const data = await loadJSON("data/items.json");
    const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);

    container.innerHTML = items
      .map((item) => {
        const name = item.name || item.id || "Unknown item";
        const category = item.category || item.type || "";
        const subtype = item.subtype || "";
        const rarity = item.rarity || "";
        const region = item.sourceRegion || "";
        const summary = item.summary || item.description || item.notes || "";

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${category ? `<div><strong>Category:</strong> ${category}</div>` : ""}
            ${subtype ? `<div><strong>Subtype:</strong> ${subtype}</div>` : ""}
            ${rarity ? `<div><strong>Rarity:</strong> ${rarity}</div>` : ""}
            ${region ? `<div><strong>Region:</strong> ${region}</div>` : ""}
            ${
              item.virtueAttunement
                ? `<div><strong>Virtue attunement:</strong> ${item.virtueAttunement}</div>`
                : ""
            }
          </div>
        `;

        // Try to find a map-related link: links.map, links.mapUrl, item.mapLink, item.mapUrl, etc.
        const mapUrl =
          (item.links && (item.links.map || item.links.mapUrl)) ||
          item.mapLink ||
          item.mapUrl ||
          null;

        const linksHtml = buildWikiLinks(item.links, mapUrl);

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div class="wiki-item-name">${name}</div>
              <div class="wiki-item-meta">
                ${[category, subtype, rarity].filter(Boolean).join(" · ")}
              </div>
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
    const data = await loadJSON("data/enemies.json");
    const enemies = Array.isArray(data)
      ? data
      : (Array.isArray(data.enemies) ? data.enemies : []);

    container.innerHTML = enemies
      .map((enemy) => {
        const name = enemy.name || enemy.id || "Unknown enemy";
        const type = enemy.type || "Enemy";
        const faction = enemy.faction || "";
        const threatTier = enemy.threatTier || "";
        const region = enemy.primaryRegion || enemy.location || "";
        const summary = enemy.summary || enemy.description || "";

        const metaParts = [];
        if (faction) metaParts.push(faction);
        if (type) metaParts.push(type);
        if (threatTier) metaParts.push(threatTier);
        const meta = metaParts.join(" · ");

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${region ? `<div><strong>Region:</strong> ${region}</div>` : ""}
            ${
              enemy.cooldown != null
                ? `<div><strong>Respawn / cooldown:</strong> ${enemy.cooldown}</div>`
                : ""
            }
          </div>
        `;

        const mapUrl =
          (enemy.links && (enemy.links.map || enemy.links.mapUrl)) ||
          enemy.mapLink ||
          enemy.mapUrl ||
          null;

        const linksHtml = buildWikiLinks(enemy.links, mapUrl);

        const iconHtml = enemy.icon
          ? `<div class="wiki-item-icon"><img src="${enemy.icon}" alt=""></div>`
          : "";

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div>
                <div class="wiki-item-name">${name}</div>
                <div class="wiki-item-meta">${meta}</div>
              </div>
              ${iconHtml}
            </div>
            <div class="wiki-item-details">
              ${summary ? `<p>${summary}</p>` : ""}
              ${metaGrid}
              ${
                Array.isArray(enemy.notableTraits) && enemy.notableTraits.length
                  ? `<p><strong>Notable traits:</strong> ${enemy.notableTraits.join(", ")}</p>`
                  : ""
              }
              ${
                Array.isArray(enemy.notableDrops) && enemy.notableDrops.length
                  ? `<p><strong>Notable drops:</strong> ${enemy.notableDrops.join(", ")}</p>`
                  : ""
              }
              ${linksHtml}
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


async function renderWikiPacts() {
  const container = document.getElementById("wikiPactsContainer");
  if (!container) return;

  // simple clamped % helper so bars are never invisible
  function pct(value, max) {
    if (typeof value !== "number" || !isFinite(value)) return 0;
    const raw = (value / (max || 1)) * 100;
    return Math.max(6, Math.min(100, raw)); // min 6% so you can see it
  }

  try {
    const data = await loadJSON("data/pacts.json");
    const pacts = Array.isArray(data) ? data : (Array.isArray(data.pacts) ? data.pacts : []);

    container.innerHTML = pacts
      .map((pact) => {
        const name = pact.name || pact.id || "Unknown pact";

        const bonus = pact.bonus || {};
        const defense = pact.defense || {};

        const virtue =
          bonus.virtueType ||
          pact.virtueOrder ||
          "";

        const roleGuess = virtue ? `${virtue} leaning` : "";

        const abilitiesLine = pact.abilities
          ? pact.abilities
          : (Array.isArray(pact.abilitiesExpanded) && pact.abilitiesExpanded.length
              ? pact.abilitiesExpanded
                  .map((a) => a.name)
                  .filter(Boolean)
                  .join(", ")
              : "");

        const desc = pact.description || "";

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${
              bonus.hp != null
                ? `<div><strong>Bonus HP:</strong> ${bonus.hp}</div>`
                : ""
            }
            ${
              bonus.virtueType
                ? `<div><strong>Virtue type:</strong> ${bonus.virtueType}</div>`
                : ""
            }
            ${
              bonus.virtueValue != null
                ? `<div><strong>Virtue value:</strong> ${bonus.virtueValue}</div>`
                : ""
            }
            ${
              defense.magick != null
                ? `<div><strong>Magick defence:</strong> ${defense.magick}</div>`
                : ""
            }
            ${
              defense.physical != null
                ? `<div><strong>Physical defence:</strong> ${defense.physical}</div>`
                : ""
            }
            ${
              defense.stabilityIncrease != null
                ? `<div><strong>Stability bonus:</strong> ${defense.stabilityIncrease}</div>`
                : ""
            }
            ${
              pact.unarmedDamage != null
                ? `<div><strong>Unarmed damage:</strong> ${pact.unarmedDamage}</div>`
                : ""
            }
          </div>
        `;

        // Bars: pick very rough max values; these are conceptual, not literal
        const hpPct       = pct(bonus.hp, 100);
        const magDefPct   = pct(defense.magick, 100);
        const phyDefPct   = pct(defense.physical, 100);
        const stabPct     = pct(defense.stabilityIncrease, 50);
        const unarmedPct  = pct(pact.unarmedDamage, 100);
        const virtuePct   = pct(bonus.virtueValue, 50);

        const statBars = `
          <div class="wiki-stat-block">
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">HP Bonus</div>
              <div class="wiki-stat-track">
                <div class="wiki-stat-fill" style="width:${hpPct}%;"></div>
              </div>
              <div class="wiki-stat-value">${bonus.hp ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Magick Def.</div>
              <div class="wiki-stat-track">
                <div class="wiki-stat-fill" style="width:${magDefPct}%;"></div>
              </div>
              <div class="wiki-stat-value">${defense.magick ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Physical Def.</div>
              <div class="wiki-stat-track">
                <div class="wiki-stat-fill" style="width:${phyDefPct}%;"></div>
              </div>
              <div class="wiki-stat-value">${defense.physical ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Stability</div>
              <div class="wiki-stat-track">
                <div class="wiki-stat-fill" style="width:${stabPct}%;"></div>
              </div>
              <div class="wiki-stat-value">${defense.stabilityIncrease ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Unarmed</div>
              <div class="wiki-stat-track">
                <div class="wiki-stat-fill" style="width:${unarmedPct}%;"></div>
              </div>
              <div class="wiki-stat-value">${pact.unarmedDamage ?? "-"}</div>
            </div>
            <div class="wiki-stat-row">
              <div class="wiki-stat-label">Virtue</div>
              <div class="wiki-stat-track">
                <div class="wiki-stat-fill" style="width:${virtuePct}%;"></div>
              </div>
              <div class="wiki-stat-value">${bonus.virtueValue ?? "-"}</div>
            </div>
          </div>
        `;

        const abilitiesBlock = abilitiesLine
          ? `<p><strong>Abilities:</strong> ${abilitiesLine}</p>`
          : (Array.isArray(pact.abilitiesExpanded) && pact.abilitiesExpanded.length
              ? `<ul style="margin-top:0.3rem;">${pact.abilitiesExpanded
                  .map(
                    (a) =>
                      `<li><strong>${a.name}:</strong> ${a.description || ""}</li>`
                  )
                  .join("")}</ul>`
              : "");

        const linksHtml = buildWikiLinks(pact.links);

        return `
          <li class="wiki-item">
            <div class="wiki-item-header">
              <div class="wiki-item-name">${name}</div>
              <div class="wiki-item-meta">
                ${virtue ? `<span class="wiki-chip">${virtue}</span>` : ""}
              </div>
            </div>
            <div class="wiki-item-details">
              ${desc ? `<p>${desc}</p>` : ""}
              ${metaGrid}
              ${statBars}
              ${abilitiesBlock}
              ${linksHtml}
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
          <div class="wiki-item-name">Unable to load pacts</div>
          <div class="wiki-item-meta">Check data/pacts.json</div>
        </div>
      </li>
    `;
  }
}


// Accordion behavior: click to expand one at a time within a list
function setupWikiAccordions() {
  const lists = document.querySelectorAll(
    "#wikiItemsContainer, #wikiEnemiesContainer, #wikiPactsContainer"
  );
  if (!lists.length) return;

  lists.forEach((list) => {
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

// Search across whatever is currently visible
function setupWikiSearch() {
  const searchInput = document.getElementById("wikiSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    const allItems = document.querySelectorAll(
      "#wikiItemsContainer .wiki-item, #wikiEnemiesContainer .wiki-item, #wikiPactsContainer .wiki-item"
    );

    allItems.forEach((item) => {
      const panel = item.closest(".wiki-panel");
      const panelHidden = panel && panel.dataset.hidden === "true";
      if (panelHidden) {
        // respect tab hiding
        return;
      }
      const text = (item.textContent || "").toLowerCase();
      item.style.display = !query || text.includes(query) ? "" : "none";
    });
  });
}

// Tabs: filter which panels are shown
function setupWikiTabs() {
  const tabs = document.querySelectorAll(".wiki-tab");
  const panels = document.querySelectorAll(".wiki-panel");
  if (!tabs.length || !panels.length) return;

  function applyTab(target) {
    tabs.forEach((t) => {
      t.classList.toggle("active", t.dataset.target === target);
    });

    panels.forEach((panel) => {
      const panelKey = panel.dataset.panel;
      let hidden = false;

      if (target === "all") hidden = false;
      else hidden = panelKey !== target;

      panel.dataset.hidden = hidden ? "true" : "false";
      panel.style.display = hidden ? "none" : "";
    });
  }

  // Default: "all"
  applyTab("all");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      applyTab(tab.dataset.target || "all");
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
// BUILD LAB: virtues → stats, with pact & weapon modifiers (robust)
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
    const v = clamp(value || 0, 0, 5); // 0–5 scale
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
      const label =
        (p && (p.role || p.name || "").toString()) || "–";
      pactRoleText.textContent = label;
    }
    if (weaponRoleText) {
      const label =
        (w && (w.type || w.category || w.name || "").toString()) || "–";
      weaponRoleText.textContent = label;
    }
  }

  // ------------- Pact & Weapon style keys (robust to JSON naming) -------------

  function getPactStyleKey(pact) {
    if (!pact) return "neutral";
    const text = (
      (pact.role || pact.name || pact.id || "")
        .toString()
        .toLowerCase()
    );

    if (text.includes("defend") || text.includes("warden") || text.includes("tank")) {
      return "defender";
    }
    if (text.includes("vanguard") || text.includes("aggress") || text.includes("assault")) {
      return "vanguard";
    }
    if (text.includes("mystic") || text.includes("spirit") || text.includes("caster")) {
      return "mystic";
    }
    return "neutral";
  }

  function getWeaponTypeKey(weapon) {
    if (!weapon) return "balanced";

    const text = (
      (weapon.type || weapon.category || weapon.role || weapon.name || weapon.id || "")
        .toString()
        .toLowerCase()
    );

    if (
      text.includes("staff") ||
      text.includes("wand") ||
      text.includes("spirit") ||
      text.includes("rod")
    ) {
      return "spirit";
    }
    if (
      text.includes("rapier") ||
      text.includes("dagger") ||
      text.includes("finesse") ||
      text.includes("duelist")
    ) {
      return "finesse";
    }
    if (
      text.includes("bow") ||
      text.includes("ranged") ||
      text.includes("crossbow")
    ) {
      return "ranged";
    }
    if (
      text.includes("greatsword") ||
      text.includes("heavy") ||
      text.includes("hammer") ||
      text.includes("axe")
    ) {
      return "heavy";
    }
    if (
      text.includes("shield") ||
      text.includes("sword & shield") ||
      text.includes("sword_shield")
    ) {
      return "sword_shield";
    }
    return "balanced";
  }

  // Pact modifiers keyed by style (not by exact ID)
  const pactStyleModifiers = {
    defender: { damage: -0.4, defense: +1.3, mobility: -0.4, control: +0.3 },
    vanguard: { damage: +1.0, defense: -0.6, mobility: +0.4, control: 0 },
    mystic:   { damage: +0.4, defense: -0.4, mobility: 0,    control: +1.0 },
    neutral:  { damage: 0,    defense: 0,    mobility: 0,    control: 0 }
  };

  function getPactMods(pactId) {
    const pact = findPact(pactId);
    const style = getPactStyleKey(pact);
    return pactStyleModifiers[style] || pactStyleModifiers.neutral;
  }

  // Weapon modifiers keyed by type
  const weaponTypeModifiers = {
    sword_shield: { damage: -0.1, defense: +0.7, mobility: -0.3, control: 0 },
    heavy:        { damage: +0.7, defense: 0,    mobility: -0.5, control: -0.1 },
    spirit:       { damage: +0.4, defense: -0.5, mobility: 0,    control: +0.8 },
    finesse:      { damage: +0.2, defense: -0.2, mobility: +0.5, control: +0.3 },
    ranged:       { damage: +0.4, defense: -0.3, mobility: +0.2, control: +0.4 },
    balanced:     { damage: 0,    defense: 0,    mobility: 0,    control: 0 }
  };

  function getWeaponMods(weaponId) {
    const weapon = findWeapon(weaponId);
    const typeKey = getWeaponTypeKey(weapon);
    return weaponTypeModifiers[typeKey] || weaponTypeModifiers.balanced;
  }

  // ---------- Core formula: Virtues → stats, then Pact & Weapon modifiers ----------

  function computeMetricsFromVirtues(virtues, pactId, weaponId) {
    const c = clamp(virtues.courage || 0, 0, 100);
    const g = clamp(virtues.grace || 0, 0, 100);
    const s = clamp(virtues.spirit || 0, 0, 100);

    const cN = c / 100;
    const gN = g / 100;
    const sN = s / 100;

    const weapon = findWeapon(weaponId);
    const weaponType = getWeaponTypeKey(weapon);

    let dmgWeights;
    if (weaponType === "heavy" || weaponType === "sword_shield") {
      // Physical: Courage dominant
      dmgWeights = { c: 0.6, g: 0.1, s: 0.3 };
    } else if (weaponType === "finesse" || weaponType === "ranged") {
      // Finesse / ranged: Courage + Grace
      dmgWeights = { c: 0.4, g: 0.4, s: 0.2 };
    } else if (weaponType === "spirit") {
      // Caster: Spirit heavy
      dmgWeights = { c: 0.15, g: 0.15, s: 0.7 };
    } else {
      // Balanced fallback
      dmgWeights = { c: 0.45, g: 0.2, s: 0.35 };
    }

    // Base 0–5 stats
    // Courage → defense + physical damage
    // Grace   → mobility + control
    // Spirit  → magic damage + control
    let damageBase =
      5 * (dmgWeights.c * cN + dmgWeights.g * gN + dmgWeights.s * sN);
    let defenseBase = 5 * (0.7 * cN + 0.1 * gN + 0.2 * sN);
    let mobilityBase = 5 * (0.1 * cN + 0.75 * gN + 0.15 * sN);
    let controlBase = 5 * (0.15 * cN + 0.35 * gN + 0.5 * sN);

    // Pact & weapon modifiers
    const pactMods = getPactMods(pactId);
    const weapMods = getWeaponMods(weaponId);

    let damage =
      damageBase + (pactMods.damage || 0) + (weapMods.damage || 0);
    let defense =
      defenseBase + (pactMods.defense || 0) + (weapMods.defense || 0);
    let mobility =
      mobilityBase + (pactMods.mobility || 0) + (weapMods.mobility || 0);
    let control =
      controlBase + (pactMods.control || 0) + (weapMods.control || 0);

    damage = clamp(damage, 0, 5);
    defense = clamp(defense, 0, 5);
    mobility = clamp(mobility, 0, 5);
    control = clamp(control, 0, 5);

    // Complexity based on how even the virtues are
    const total = c + g + s || 1;
    const avg = total / 3;
    const variance =
      (Math.abs(c - avg) + Math.abs(g - avg) + Math.abs(s - avg)) / 3;
    let complexity = 5 - Math.round(variance / 20);
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
      courage: clamp(virtues.courage || 0, 0, 100),
      grace: clamp(virtues.grace || 0, 0, 100),
      spirit: clamp(virtues.spirit || 0, 0, 100)
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
    const weaponId =
      weaponSelect.value ||
      (activeBuildId && findBuild(activeBuildId)?.weaponId) ||
      "";

    const metrics = computeMetricsFromVirtues(
      currentVirtues,
      pactId,
      weaponId
    );
    applyMetricsToUI(metrics);
  }

  function applyBuildToUI(build) {
    if (!build) return;
    activeBuildId = build.id;

    // Text / tags / tips
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

    // Pact / weapon selects
    if (build.pactId && findPact(build.pactId)) {
      pactSelect.value = build.pactId;
    }
    if (build.weaponId && findWeapon(build.weaponId)) {
      weaponSelect.value = build.weaponId;
    }
    updatePactWeaponText();

    // Virtues
    const virtues = build.virtues || { courage: 40, grace: 30, spirit: 30 };
    applyVirtuesToUI(virtues);

    // Recalc with current pact/weapon
    recalcMetrics();
  }

  function setMode(newMode) {
    buildMode = newMode;
    const isCustom = newMode === "custom";

    if (customVirtueControls)
      customVirtueControls.style.display = isCustom ? "block" : "none";
    if (customNote) customNote.style.display = isCustom ? "block" : "none";

    const sliders = [
      virtueCourageInput,
      virtueGraceInput,
      virtueSpiritInput
    ];
    sliders.forEach((s) => {
      if (s) s.disabled = !isCustom;
    });

    if (!isCustom && activeBuildId && buildData) {
      const b = findBuild(activeBuildId);
      if (b) applyBuildToUI(b);
    }

    if (isCustom) {
      recalcMetrics();
    }
  }

  // ---------- Load data ----------
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
  setMode("preset");
  if (modeRadios && modeRadios.length) {
    modeRadios.forEach((r) => {
      r.checked = r.value === "preset";
    });
  }

  // Build change
  buildSelect.addEventListener("change", () => {
    const b = findBuild(buildSelect.value);
    if (b) applyBuildToUI(b);
  });

  // Pact & weapon changes → always recalc
  pactSelect.addEventListener("change", () => {
    updatePactWeaponText();
    recalcMetrics();
  });

  weaponSelect.addEventListener("change", () => {
    updatePactWeaponText();
    recalcMetrics();
  });

  // Virtue sliders (Custom mode only)
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
    renderWikiPacts(),   // ← add this
    renderRegions(),
    renderBuildLab()
  ]);

  setupGuideFilters();
  setupGuideSearch();
  setupWikiTabs();        // ← new
  setupWikiAccordions();
  setupWikiSearch();
})();