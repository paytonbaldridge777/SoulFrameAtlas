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
// BUILD LAB: render + wire up
// =====================================================

let buildLabData = null;
let currentBuildId = null;
let currentBuildMode = "preset";
let currentCustomState = null;

async function renderBuildLab() {
  const root = document.getElementById("buildLabRoot");
  if (!root) return; // not on build-lab.html

  let data;
  try {
    data = await loadJSON("data/builds.json");
    buildLabData = data;
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

  const buildSelect = document.getElementById("buildSelect");
  const pactSelect = document.getElementById("pactSelect");
  const weaponSelect = document.getElementById("weaponSelect");

  const buildName = document.getElementById("buildName");
  const buildBlurb = document.getElementById("buildBlurb");
  const buildTags = document.getElementById("buildTags");
  const buildTips = document.getElementById("buildTips");

  const virtueCourage = document.getElementById("virtueCourageValue");
  const virtueGrace = document.getElementById("virtueGraceValue");
  const virtueSpirit = document.getElementById("virtueSpiritValue");

  const barDamage = document.getElementById("barDamage");
  const barDefense = document.getElementById("barDefense");
  const barMobility = document.getElementById("barMobility");
  const barControl = document.getElementById("barControl");
  const complexityStars = document.getElementById("complexityStars");

  const pactRoleText = document.getElementById("pactRoleText");
  const weaponRoleText = document.getElementById("weaponRoleText");

  const customVirtueControls = document.getElementById("customVirtueControls");
  const customMetricControls = document.getElementById("customMetricControls");
  const customNote = document.getElementById("customNote");

  const virtueCourageInput = document.getElementById("virtueCourageInput");
  const virtueGraceInput = document.getElementById("virtueGraceInput");
  const virtueSpiritInput = document.getElementById("virtueSpiritInput");

  const metricDamageInput = document.getElementById("metricDamageInput");
  const metricDefenseInput = document.getElementById("metricDefenseInput");
  const metricMobilityInput = document.getElementById("metricMobilityInput");
  const metricControlInput = document.getElementById("metricControlInput");
  const metricComplexityInput = document.getElementById("metricComplexityInput");

  const modeRadios = document.querySelectorAll("input[name='buildMode']");

  if (
    !buildSelect ||
    !pactSelect ||
    !weaponSelect ||
    !buildName ||
    !buildBlurb
  ) {
    console.warn("Build Lab elements missing from DOM.");
    return;
  }

  // Helpers
  function findPact(id) {
    return data.pacts.find((p) => p.id === id);
  }

  function findWeapon(id) {
    return data.weapons.find((w) => w.id === id);
  }

  function findBuild(id) {
    return data.builds.find((b) => b.id === id);
  }

  function setBar(el, value) {
    if (!el) return;
    const clamped = Math.max(0, Math.min(5, value || 0));
    const pct = (clamped / 5) * 100;
    el.style.width = pct + "%";
  }

  function setVirtueText(el, value) {
    if (!el) return;
    el.textContent =
      typeof value === "number" ? `${value}%` : value ? String(value) : "–";
  }

  function updatePactWeaponMeta() {
    const pact = findPact(pactSelect.value);
    const weapon = findWeapon(weaponSelect.value);

    if (pactRoleText) {
      pactRoleText.textContent = pact ? `${pact.name} – ${pact.role}` : "–";
    }
    if (weaponRoleText) {
      weaponRoleText.textContent = weapon ? `${weapon.name} – ${weapon.role}` : "–";
    }
  }

  function applyVirtuesAndMetrics(virtues, metrics) {
    const v = virtues || {};
    const m = metrics || {};

    setVirtueText(virtueCourage, v.courage);
    setVirtueText(virtueGrace, v.grace);
    setVirtueText(virtueSpirit, v.spirit);

    setBar(barDamage, m.damage);
    setBar(barDefense, m.defense);
    setBar(barMobility, m.mobility);
    setBar(barControl, m.control);

    if (complexityStars) {
      const comp = Math.max(1, Math.min(5, m.complexity || 1));
      complexityStars.textContent =
        "★".repeat(comp) + "☆".repeat(Math.max(0, 5 - comp));
    }
  }

  function syncInputsFromState(state) {
    if (!state) return;
    const v = state.virtues || {};
    const m = state.metrics || {};

    if (virtueCourageInput) virtueCourageInput.value = v.courage ?? 0;
    if (virtueGraceInput) virtueGraceInput.value = v.grace ?? 0;
    if (virtueSpiritInput) virtueSpiritInput.value = v.spirit ?? 0;

    if (metricDamageInput) metricDamageInput.value = m.damage ?? 0;
    if (metricDefenseInput) metricDefenseInput.value = m.defense ?? 0;
    if (metricMobilityInput) metricMobilityInput.value = m.mobility ?? 0;
    if (metricControlInput) metricControlInput.value = m.control ?? 0;
    if (metricComplexityInput) metricComplexityInput.value = m.complexity ?? 1;
  }

  function buildStateFromInputs() {
    const virtues = {
      courage: virtueCourageInput ? Number(virtueCourageInput.value) || 0 : 0,
      grace: virtueGraceInput ? Number(virtueGraceInput.value) || 0 : 0,
      spirit: virtueSpiritInput ? Number(virtueSpiritInput.value) || 0 : 0
    };
    const metrics = {
      damage: metricDamageInput ? Number(metricDamageInput.value) || 0 : 0,
      defense: metricDefenseInput ? Number(metricDefenseInput.value) || 0 : 0,
      mobility: metricMobilityInput ? Number(metricMobilityInput.value) || 0 : 0,
      control: metricControlInput ? Number(metricControlInput.value) || 0 : 0,
      complexity: metricComplexityInput
        ? Number(metricComplexityInput.value) || 1
        : 1
    };
    return { virtues, metrics };
  }

  function updateCustomFromInputs() {
    currentCustomState = buildStateFromInputs();
    applyVirtuesAndMetrics(
      currentCustomState.virtues,
      currentCustomState.metrics
    );
  }

  function setMode(mode) {
    currentBuildMode = mode;

    if (customVirtueControls) {
      customVirtueControls.style.display =
        mode === "custom" ? "block" : "none";
    }
    if (customMetricControls) {
      customMetricControls.style.display =
        mode === "custom" ? "block" : "none";
    }
    if (customNote) {
      customNote.style.display = mode === "custom" ? "block" : "none";
    }

    // When switching to preset, reset custom state from the current build
    if (mode === "preset" && currentBuildId) {
      const b = findBuild(currentBuildId);
      if (b) {
        currentCustomState = {
          virtues: { ...(b.virtues || {}) },
          metrics: { ...(b.metrics || {}) }
        };
        syncInputsFromState(currentCustomState);
        applyVirtuesAndMetrics(b.virtues, b.metrics);
      }
    } else if (mode === "custom" && currentBuildId) {
      // Seed custom state from the current build if none exists yet
      if (!currentCustomState) {
        const b = findBuild(currentBuildId);
        if (b) {
          currentCustomState = {
            virtues: { ...(b.virtues || {}) },
            metrics: { ...(b.metrics || {}) }
          };
        }
      }
      syncInputsFromState(currentCustomState);
      applyVirtuesAndMetrics(
        currentCustomState.virtues,
        currentCustomState.metrics
      );
    }
  }

  function updateBuildUI(buildId) {
    const build = findBuild(buildId);
    if (!build) return;

    currentBuildId = buildId;

    buildName.textContent = build.name;
    buildBlurb.textContent = build.summary || "";

    if (buildTags) {
      buildTags.innerHTML = (build.tags || [])
        .map((t) => `<span class="tag">${t}</span>`)
        .join("");
    }

    if (buildTips) {
      const tips = build.tips || [];
      if (!tips.length) {
        buildTips.innerHTML = `<li>No specific tips yet—experiment and adjust as you go.</li>`;
      } else {
        buildTips.innerHTML = tips.map((t) => `<li>${t}</li>`).join("");
      }
    }

    // Pact & weapon selects
    if (build.pactId && findPact(build.pactId)) {
      pactSelect.value = build.pactId;
    }
    if (build.weaponId && findWeapon(build.weaponId)) {
      weaponSelect.value = build.weaponId;
    }
    updatePactWeaponMeta();

    if (currentBuildMode === "preset") {
      currentCustomState = {
        virtues: { ...(build.virtues || {}) },
        metrics: { ...(build.metrics || {}) }
      };
      syncInputsFromState(currentCustomState);
      applyVirtuesAndMetrics(build.virtues, build.metrics);
    } else {
      // custom mode: seed if needed, otherwise respect current sliders
      if (!currentCustomState) {
        currentCustomState = {
          virtues: { ...(build.virtues || {}) },
          metrics: { ...(build.metrics || {}) }
        };
        syncInputsFromState(currentCustomState);
      }
      applyVirtuesAndMetrics(
        currentCustomState.virtues,
        currentCustomState.metrics
      );
    }
  }

  // Populate selects
  buildSelect.innerHTML = "";
  data.builds.forEach((b, idx) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (idx === 0) opt.selected = true;
    buildSelect.appendChild(opt);
  });

  pactSelect.innerHTML = "";
  data.pacts.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    pactSelect.appendChild(opt);
  });

  weaponSelect.innerHTML = "";
  data.weapons.forEach((w) => {
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = w.name;
    weaponSelect.appendChild(opt);
  });

  // Event wiring
  buildSelect.addEventListener("change", () => {
    const id = buildSelect.value;
    if (id) {
      currentCustomState = null; // reset custom when switching builds
      updateBuildUI(id);
    }
  });

  pactSelect.addEventListener("change", () => {
    updatePactWeaponMeta();
  });

  weaponSelect.addEventListener("change", () => {
    updatePactWeaponMeta();
  });

  if (modeRadios && modeRadios.length) {
    modeRadios.forEach((r) => {
      r.addEventListener("change", () => {
        if (r.checked) {
          setMode(r.value);
        }
      });
    });
  }

  if (virtueCourageInput)
    virtueCourageInput.addEventListener("input", updateCustomFromInputs);
  if (virtueGraceInput)
    virtueGraceInput.addEventListener("input", updateCustomFromInputs);
  if (virtueSpiritInput)
    virtueSpiritInput.addEventListener("input", updateCustomFromInputs);

  if (metricDamageInput)
    metricDamageInput.addEventListener("input", updateCustomFromInputs);
  if (metricDefenseInput)
    metricDefenseInput.addEventListener("input", updateCustomFromInputs);
  if (metricMobilityInput)
    metricMobilityInput.addEventListener("input", updateCustomFromInputs);
  if (metricControlInput)
    metricControlInput.addEventListener("input", updateCustomFromInputs);
  if (metricComplexityInput)
    metricComplexityInput.addEventListener("input", updateCustomFromInputs);

  // Initial state: first build, preset mode
  if (data.builds.length > 0) {
    currentBuildMode = "preset";
    if (modeRadios && modeRadios.length) {
      modeRadios.forEach((r) => {
        r.checked = r.value === "preset";
      });
    }
    updateBuildUI(data.builds[0].id);
    setMode("preset");
  }
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
