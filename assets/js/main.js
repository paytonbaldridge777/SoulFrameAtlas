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
    const items = Array.isArray(data) ? data : (data?.items || []);

    container.innerHTML = items
      .map((item) => {
        const name =
          item.name || item.id || "Unknown Item";

        const description =
          item.Description ||
          item.summary ||
          item.notes ||
          "";

        const dropSource =
          item.DropSource || item.dropSource || "";

        const rarity = item.rarity || "";
        const resourceType =
          item.ResourceType || item.category || "";

        const icon =
          item.ImgIcon || item.icon || "";

        const subtitleParts = [];
        if (resourceType) subtitleParts.push(resourceType);
        if (rarity) subtitleParts.push(rarity);
        const subtitle = subtitleParts.join(" • ");

        const linksHtml = buildWikiLinks(item.links);

        // --- Modernize DROPS FROM section with card-based layout ---
        let dropsFromSection = "";
        if (dropSource) {
          // Parse the drop source string (usually semicolon-separated)
          const sources = dropSource
            .split(/[;,]/)
            .map(s => s.trim())
            .filter(Boolean);

          if (sources.length > 0) {
            const dropCards = sources.map(source => {
              return `<li class="wiki-drop-source-card">
                <div class="wiki-drop-source-name">${source}</div>
              </li>`;
            }).join("");

            dropsFromSection = `<div class="wiki-card-section">
              <div class="wiki-card-section-title">Drops From</div>
              <ul class="wiki-drop-sources-grid">${dropCards}</ul>
            </div>`;
          }
        }

        const linksSection = linksHtml
          ? `<div class="wiki-card-section">
               <div class="wiki-card-section-title">More Info</div>
               ${linksHtml}
             </div>`
          : "";

        return `
        <li class="wiki-item wiki-card wiki-item-card">

          <div class="wiki-card-header">
            ${
              icon
                ? `<div class="wiki-card-icon"><img src="${icon}" alt="${name}"></div>`
                : ""
            }
            <div>
              <div class="wiki-card-title">${name}</div>
              ${subtitle ? `<div class="wiki-card-subtitle">${subtitle}</div>` : ""}
            </div>
          </div>
          <div class="wiki-card-body">
            ${description ? `<p>${description}</p>` : ""}
            ${dropsFromSection}
            ${linksSection}
          </div>
        </li>
      `;
      })
      .join("");
    
    // Setup expand/collapse functionality after items are rendered
    setupItemCardExpansion();
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
        const description = enemy.description || "";

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
        <li class="wiki-item wiki-card wiki-enemy-card">
          <div class="wiki-card-header">
            ${
              enemy.icon
                ? `<div class="wiki-card-icon-enemy"><img src="${enemy.icon}" alt="${name}"></div>`
                : ""
            }
            <div>
              <div class="wiki-card-title">${name}</div>
              <div class="wiki-card-subtitle">${subtitle}</div>
            </div>
          </div>
          <div class="wiki-card-body">
            ${summary ? `<p>${summary}</p>` : ""}
            ${metaGrid}
            ${linksHtml}
          </div>
        </li>
      `;
      })
      .join("");
    
    // Setup expand/collapse functionality after enemies are rendered
    setupEnemyCardExpansion();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="wiki-item">Unable to load enemies.json</li>`;
  }
}

// =====================================================
// WIKI — WEAPONS (ACCORDION LAYOUT + STAT BARS)
// =====================================================
async function renderWikiWeapons() {
  const container = document.getElementById("wikiWeaponsContainer");
  if (!container) return;

  // tiny helper to clean the wiki-style ''' markup
  const cleanDesc = (txt) =>
    (txt || "").replace(/'''/g, "").trim();

  try {
    const data = await loadJSON("data/weapons.json");
    const weapons = Array.isArray(data) ? data : data?.weapons || [];

    container.innerHTML = weapons
      .map((w) => {
        const name = w.name || w.ItemID || w.id || "Unknown weapon";
        const desc = cleanDesc(w.description || w.Description || "");
        const rarity = w.rarity || w.Rarity || "";
        const dmgType = w.damageType || w.DamageType || "";
        const slot = w.slot || w.Slot || "Weapon";
        const attuneVirtue = w.attuneVirtue || w.AttuneVirtue || "";
        const attuneTier = w.attuneTier || w.AttuneTier || "";
        const reqVirtue = w.reqVirtue || w.ReqVirtue || "";
        const art = w.art || w.Art || "";
        const icon = w.imgIcon || w.ImgIcon || "";

        const craft = w.craft || w.Craft || null;
        const stats = w.stats || w.Stats || null;
        const linksHtml = buildWikiLinks(w.links);

        // --- Virtues & Role cards (modernized) ---
        const virtueCards = [];
        if (slot) virtueCards.push('<li class="wiki-virtue-card"><div class="wiki-virtue-card-label">Slot</div><div class="wiki-virtue-card-value">' + slot + '</div></li>');
        if (art) virtueCards.push('<li class="wiki-virtue-card"><div class="wiki-virtue-card-label">Archetype</div><div class="wiki-virtue-card-value">' + art + '</div></li>');
        if (dmgType) virtueCards.push('<li class="wiki-virtue-card"><div class="wiki-virtue-card-label">Damage</div><div class="wiki-virtue-card-value">' + dmgType + '</div></li>');
        if (attuneVirtue) virtueCards.push('<li class="wiki-virtue-card"><div class="wiki-virtue-card-label">Attune Virtue</div><div class="wiki-virtue-card-value">' + attuneVirtue + '</div></li>');
        if (attuneTier) virtueCards.push('<li class="wiki-virtue-card"><div class="wiki-virtue-card-label">Attune Tier</div><div class="wiki-virtue-card-value">' + attuneTier + '</div></li>');
        if (reqVirtue) virtueCards.push('<li class="wiki-virtue-card"><div class="wiki-virtue-card-label">Req Virtue</div><div class="wiki-virtue-card-value">' + reqVirtue + '</div></li>');
        
        const virtuesBlock = virtueCards.length ? 
          '<ul class="wiki-virtue-grid">' + virtueCards.join("") + '</ul>'
          : "";

        // --- Crafting cards (modernized) ---
        let craftBlock = "";
        if (craft && typeof craft === "object") {
          const ing = Array.isArray(craft.ingredients) ? craft.ingredients : [];
          
          const craftCards = [];
          if (craft.Fragments) craftCards.push('<li class="wiki-crafting-card"><div class="wiki-crafting-card-label">Fragments</div><div class="wiki-crafting-card-value">' + craft.Fragments + '</div></li>');
          if (craft.Time != null) {
            const timeValue = typeof craft.Time === 'string' && craft.Time.includes('min') ? craft.Time : craft.Time + 'min';
            craftCards.push('<li class="wiki-crafting-card"><div class="wiki-crafting-card-label">Time</div><div class="wiki-crafting-card-value">' + timeValue + '</div></li>');
          }
          if (craft.Cost != null) craftCards.push('<li class="wiki-crafting-card"><div class="wiki-crafting-card-label">Cost</div><div class="wiki-crafting-card-value">' + craft.Cost + '</div></li>');
          if (craft.BondReq && craft.BondReq !== "N/A") craftCards.push('<li class="wiki-crafting-card"><div class="wiki-crafting-card-label">Bond Req</div><div class="wiki-crafting-card-value">' + craft.BondReq + '</div></li>');
          
          const craftCardsHtml = craftCards.length ? '<ul class="wiki-crafting-grid">' + craftCards.join("") + '</ul>' : "";
          const ingredientsHtml = ing.length 
            ? '<div class="wiki-crafting-ingredients"><div class="wiki-crafting-ingredients-title">Ingredients</div><ul class="wiki-crafting-ingredients-list">' + 
              ing.map(x => '<li>' + x.qty + ' × ' + x.item + '</li>').join("") + 
              '</ul></div>'
            : "";
          
          craftBlock = '<div class="wiki-card-section"><div class="wiki-card-section-title">Crafting</div>' + 
            craftCardsHtml + ingredientsHtml + '</div>';
        }

        // --- key stats (BEAUTIFIED DISPLAY) ---
        let statsBlock = "";
        if (stats && typeof stats === "object") {
          const lvl0 = stats.Lvl0 || {};
          const lvl30 = stats.Lvl30 || {};
          const caps = stats.AttuneCaps || {};

          // Helper to create a stat card with progression
          const createStatCard = (label, baseVal, maxVal) => {
            if (baseVal == null && maxVal == null) return "";
            
            const base = baseVal ?? "?";
            const max = maxVal ?? "?";
            const hasProgression = baseVal != null && maxVal != null && baseVal !== "?";
            
            // Calculate progress percentage for visual bar (based on growth from base to max)
            let progressPercent = 0;
            if (hasProgression && typeof baseVal === 'number' && typeof maxVal === 'number' && maxVal > 0) {
              // Show progression as percentage of max value
              progressPercent = Math.min(100, (maxVal / (maxVal + baseVal)) * 100);
            }
            
            const progressBar = progressPercent > 0 
              ? '<div class="wiki-stat-progress"><div class="wiki-stat-progress-fill" style="width: ' + progressPercent + '%"></div></div>'
              : '';
            
            return '<li class="wiki-stat-card">' +
              '<div class="wiki-stat-card-label">' + label + '</div>' +
              '<div class="wiki-stat-card-value">' +
                '<span class="wiki-stat-base">' + base + '</span>' +
                '<span class="wiki-stat-arrow">→</span>' +
                '<span class="wiki-stat-max">' + max + '</span>' +
              '</div>' +
              progressBar +
              '</li>';
          };

          // Helper to create a single-value stat card
          const createSingleStatCard = (label, value) => {
            if (value == null || value === '') return "";
            return '<li class="wiki-stat-card">' +
              '<div class="wiki-stat-card-label">' + label + '</div>' +
              '<div class="wiki-stat-card-value">' +
                '<span class="wiki-stat-single">' + value + '</span>' +
              '</div>' +
              '</li>';
          };

          // Build stat cards
          const cards = [];
          
          // Attack stat
          if (lvl0.Attack != null || lvl30.Attack != null) {
            cards.push(createStatCard("Attack", lvl0.Attack, lvl30.Attack));
          }
          
          // Charged Attack stat
          if (lvl0.ChargedAttack != null || lvl30.ChargedAttack != null) {
            cards.push(createStatCard("Charged", lvl0.ChargedAttack, lvl30.ChargedAttack));
          }
          
          // Stagger stat
          if (lvl0.Stagger != null || lvl30.Stagger != null) {
            cards.push(createStatCard("Stagger", lvl0.Stagger, lvl30.Stagger));
          }
          
          // Smite stat (special format)
          if (stats.Smite || stats.SmitePercent) {
            const smiteValue = [stats.Smite, stats.SmitePercent].filter(Boolean).join(" ");
            cards.push(createSingleStatCard("Smite", smiteValue));
          }
          
          // Virtue Cap stat
          if (stats.VirtueAttuneCap != null) {
            cards.push(createSingleStatCard("Virtue Cap", stats.VirtueAttuneCap));
          }
          
          // Caps card (special wider card)
          const hasCaps = caps.DamageLight != null || caps.DamageHeavy != null || caps.DamageChargedShot != null;
          let capsCard = "";
          if (hasCaps) {
            const capItems = [];
            if (caps.DamageLight != null) {
              capItems.push('<span class="wiki-stat-cap-item"><strong>Light</strong> ' + caps.DamageLight + '</span>');
            }
            if (caps.DamageHeavy != null) {
              capItems.push('<span class="wiki-stat-cap-item"><strong>Heavy</strong> ' + caps.DamageHeavy + '</span>');
            }
            if (caps.DamageChargedShot != null && caps.DamageChargedShot !== "-") {
              capItems.push('<span class="wiki-stat-cap-item"><strong>Charged</strong> ' + caps.DamageChargedShot + '</span>');
            }
            
            if (capItems.length > 0) {
              capsCard = '<li class="wiki-stat-card stat-caps">' +
                '<div class="wiki-stat-card-label">Damage Caps</div>' +
                '<div class="wiki-stat-caps-list">' +
                  capItems.join("") +
                '</div>' +
                '</li>';
            }
          }

          const allCards = [...cards, capsCard].filter(Boolean).join("");

          if (allCards) {
            statsBlock = '<div class="wiki-card-section">' +
              '<div class="wiki-card-section-title">Key Stats</div>' +
              '<ul class="wiki-stats-grid">' +
                allCards +
              '</ul>' +
              '</div>';
          }
        }

        const rarityClass = rarity ? "wiki-chip--" + rarity.toLowerCase() : "";

        // Pre-build HTML blocks to avoid nested template literals
        const iconHtml = icon 
          ? '<div class="wiki-card-icon"><img src="' + icon + '" alt="' + name + '"></div>'
          : "";
        
        const rarityChipHtml = rarity ? '<span class="wiki-chip ' + rarityClass + '">' + rarity + '</span>' : "";
        const dmgTypeChipHtml = dmgType ? '<span class="wiki-chip subtle">' + dmgType + '</span>' : "";
        const artChipHtml = art ? '<span class="wiki-chip subtle">' + art + '</span>' : "";
        
        const descHtml = desc ? '<div class="wiki-weapon-card-description">' + desc + '</div>' : "";
        
        const virtuesSectionHtml = virtuesBlock
          ? '<div class="wiki-card-section"><div class="wiki-card-section-title">Virtues & role</div>' + virtuesBlock + '</div>'
          : "";
        
        const linksSectionHtml = linksHtml
          ? '<div class="wiki-card-section"><div class="wiki-card-section-title">More info</div>' + linksHtml + '</div>'
          : "";

        return `
          <li class="wiki-item wiki-card wiki-weapon-card">
            <div class="wiki-card-header">
              ${iconHtml}
              <div class="wiki-card-header-text">
                <div class="wiki-card-title">${name}</div>
                <div class="wiki-card-subtitle">
                  ${rarityChipHtml}
                  ${dmgTypeChipHtml}
                  ${artChipHtml}
                </div>
              </div>
            </div>

            ${descHtml}

            <div class="wiki-card-body">
              ${virtuesSectionHtml}
              ${craftBlock}
              ${statsBlock}
              ${linksSectionHtml}
            </div>
          </li>
        `;
      })
      .join("");
    
    // Setup expand/collapse functionality after weapons are rendered
    setupWeaponCardExpansion();
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <li class="wiki-item">Unable to load weapons (check data/weapons.json)</li>
    `;
  }
}

// =====================================================
// WIKI — PACTS (ACCORDION LAYOUT + STAT BARS)
// =====================================================
async function renderWikiPacts() {
  const container = document.getElementById("wikiPactsContainer");
  if (!container) return;

  // clamp to 6–100% to keep bars visible
  const pct = (val, max) => {
    if (typeof val !== "number" || !isFinite(val)) return "6%";
    const m = max || 1;
    const p = (val / m) * 100;
    return Math.max(6, Math.min(100, p)) + "%";
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
        const icon = pact.icon || "";
        const craft = pact.craft || null;

        const virtues = bonus.virtueType || pact.virtueOrder || "";

        // --- Bonuses & Virtues (card-based layout) ---
        const bonusCards = [];
        if (bonus.hp != null) {
          bonusCards.push(`<li class="wiki-virtue-card">
            <div class="wiki-virtue-card-label">HP Bonus</div>
            <div class="wiki-virtue-card-value">${bonus.hp}</div>
          </li>`);
        }
        if (bonus.virtueType) {
          bonusCards.push(`<li class="wiki-virtue-card">
            <div class="wiki-virtue-card-label">Virtue Type</div>
            <div class="wiki-virtue-card-value">${bonus.virtueType}</div>
          </li>`);
        }
        if (bonus.virtueValue != null) {
          bonusCards.push(`<li class="wiki-virtue-card">
            <div class="wiki-virtue-card-label">Virtue Value</div>
            <div class="wiki-virtue-card-value">${bonus.virtueValue}</div>
          </li>`);
        }
        if (pact.unarmedDamage != null) {
          bonusCards.push(`<li class="wiki-virtue-card">
            <div class="wiki-virtue-card-label">Unarmed Dmg</div>
            <div class="wiki-virtue-card-value">${pact.unarmedDamage}</div>
          </li>`);
        }

        const bonusSection = bonusCards.length
          ? `<div class="wiki-card-section">
               <div class="wiki-card-section-title">Bonuses</div>
               <ul class="wiki-virtue-grid">${bonusCards.join("")}</ul>
             </div>`
          : "";

        // --- Defense stats (modernized card grid) ---
        const defenseCards = [];
        if (defense.magick != null) {
          defenseCards.push(`<li class="wiki-stat-card">
            <div class="wiki-stat-card-label">Magick Def</div>
            <div class="wiki-stat-card-value">
              <span class="wiki-stat-single">${defense.magick}</span>
            </div>
            <div class="wiki-stat-progress">
              <div class="wiki-stat-progress-fill" style="width: ${pct(defense.magick, 100)};"></div>
            </div>
          </li>`);
        }
        if (defense.physical != null) {
          defenseCards.push(`<li class="wiki-stat-card">
            <div class="wiki-stat-card-label">Physical Def</div>
            <div class="wiki-stat-card-value">
              <span class="wiki-stat-single">${defense.physical}</span>
            </div>
            <div class="wiki-stat-progress">
              <div class="wiki-stat-progress-fill" style="width: ${pct(defense.physical, 100)};"></div>
            </div>
          </li>`);
        }
        if (defense.stabilityIncrease != null) {
          defenseCards.push(`<li class="wiki-stat-card">
            <div class="wiki-stat-card-label">Stability</div>
            <div class="wiki-stat-card-value">
              <span class="wiki-stat-single">${defense.stabilityIncrease}</span>
            </div>
            <div class="wiki-stat-progress">
              <div class="wiki-stat-progress-fill" style="width: ${pct(defense.stabilityIncrease, 50)};"></div>
            </div>
          </li>`);
        }

        const defenseSection = defenseCards.length
          ? `<div class="wiki-card-section">
               <div class="wiki-card-section-title">Defense Stats</div>
               <ul class="wiki-stats-grid">${defenseCards.join("")}</ul>
             </div>`
          : "";

        // --- Abilities (modern card-based display) ---
        let abilitiesSection = "";
        if (Array.isArray(pact.abilitiesExpanded) && pact.abilitiesExpanded.length) {
          const abilityCards = pact.abilitiesExpanded
            .map((a) => {
              const abilityName = a.name || "Unnamed Ability";
              const abilityDesc = a.description || "";
              const abilityIcon = a.icon || "";

              return `<li class="wiki-ability-card">
                ${abilityIcon ? `<div class="wiki-ability-icon"><img src="${abilityIcon}" alt="${abilityName}"></div>` : ""}
                <div class="wiki-ability-content">
                  <div class="wiki-ability-name">${abilityName}</div>
                  ${abilityDesc ? `<div class="wiki-ability-desc">${abilityDesc}</div>` : ""}
                </div>
              </li>`;
            })
            .join("");

          abilitiesSection = `<div class="wiki-card-section">
            <div class="wiki-card-section-title">Abilities</div>
            <ul class="wiki-abilities-grid">${abilityCards}</ul>
          </div>`;
        }

        // --- Crafting (card-based layout like weapons) ---
        let craftBlock = "";
        if (craft && typeof craft === "object") {
          const ing = Array.isArray(craft.ingredients) ? craft.ingredients : [];
          
          const craftCards = [];
          if (craft.Fragments) {
            craftCards.push(`<li class="wiki-crafting-card">
              <div class="wiki-crafting-card-label">Fragments</div>
              <div class="wiki-crafting-card-value">${craft.Fragments}</div>
            </li>`);
          }
          if (craft.Time != null) {
            const timeValue = typeof craft.Time === 'string' && craft.Time.includes('min') 
              ? craft.Time 
              : craft.Time + 'min';
            craftCards.push(`<li class="wiki-crafting-card">
              <div class="wiki-crafting-card-label">Time</div>
              <div class="wiki-crafting-card-value">${timeValue}</div>
            </li>`);
          }
          if (craft.Cost != null) {
            craftCards.push(`<li class="wiki-crafting-card">
              <div class="wiki-crafting-card-label">Cost</div>
              <div class="wiki-crafting-card-value">${craft.Cost}</div>
            </li>`);
          }
          if (craft.BondReq && craft.BondReq !== "N/A") {
            craftCards.push(`<li class="wiki-crafting-card">
              <div class="wiki-crafting-card-label">Bond Req</div>
              <div class="wiki-crafting-card-value">${craft.BondReq}</div>
            </li>`);
          }
          
          const craftCardsHtml = craftCards.length 
            ? `<ul class="wiki-crafting-grid">${craftCards.join("")}</ul>` 
            : "";
          
          const ingredientsHtml = ing.length
            ? `<div class="wiki-crafting-ingredients">
                 <div class="wiki-crafting-ingredients-title">Ingredients</div>
                 <ul class="wiki-crafting-ingredients-list">
                   ${ing.map(x => `<li>${x.qty} × ${x.item}</li>`).join("")}
                 </ul>
               </div>`
            : "";
          
          craftBlock = `<div class="wiki-card-section">
            <div class="wiki-card-section-title">Crafting</div>
            ${craftCardsHtml}${ingredientsHtml}
          </div>`;
        }

        const linksHtml = buildWikiLinks(pact.links);
        const linksSection = linksHtml
          ? `<div class="wiki-card-section">
               <div class="wiki-card-section-title">More Info</div>
               ${linksHtml}
             </div>`
          : "";

        return `
          <li class="wiki-card wiki-item wiki-pact-card">
            <div class="wiki-card-header">
              ${icon ? `<div class="wiki-card-icon"><img src="${icon}" alt="${name}"></div>` : ""}
              <div>
                <div class="wiki-card-title">${name}</div>
                ${virtues ? `<div class="wiki-card-subtitle">${virtues}</div>` : ""}
              </div>
            </div>
            <div class="wiki-card-body">
              ${desc ? `<p>${desc}</p>` : ""}
              ${bonusSection}
              ${defenseSection}
              ${abilitiesSection}
              ${craftBlock}
              ${linksSection}
            </div>
          </li>
        `;
      })
      .join("");
    
    // Setup expand/collapse functionality after pacts are rendered
    setupPactCardExpansion();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="wiki-item">Unable to load pacts.json</li>`;
  }
}

// =====================================================
// WIKI — LOCATIONS (CARD LAYOUT)
// =====================================================
async function renderWikiLocations() {
  const container = document.getElementById("wikiLocationsContainer");
  if (!container) return;

  try {
    const data = await loadJSON("data/locations.json");
    const locations = Array.isArray(data) ? data : data?.locations || [];

    container.innerHTML = locations
      .map((location) => {
        const name = location.name || location.locationName || "Unknown Location";
        const category = location.category || "";
        const description = location.description || "";
        const icon = location.icon || "";
        const coordinates = Array.isArray(location.coordinates) 
          ? location.coordinates.join(", ") 
          : "";
        const mediaUrl = location.mediaUrl;

        const metaGrid = `
          <div class="wiki-item-meta-grid">
            ${
              category
                ? `<div><strong>Category:</strong> ${category}</div>`
                : ""
            }
            ${
              coordinates
                ? `<div><strong>Coordinates:</strong> ${coordinates}</div>`
                : ""
            }
          </div>
        `;

        const linksHtml = buildWikiLinks(location.links);

        return `
          <li class="wiki-item wiki-card wiki-location-card">
            <div class="wiki-card-header">
              ${
                icon
                  ? `<div class="wiki-card-icon"><img src="${icon}" alt="${name}"></div>`
                  : ""
              }
              <div>
                <div class="wiki-card-title">${name}</div>
                ${category ? `<div class="wiki-card-subtitle">${category}</div>` : ""}
              </div>
            </div>
            <div class="wiki-card-body">
              ${description ? `<p>${description}</p>` : ""}
              ${metaGrid}
              ${mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() ? `<div><strong>Media:</strong> <a href="${mediaUrl}" target="_blank" rel="noreferrer">View →</a></div>` : ""}
              ${linksHtml}
            </div>
          </li>
        `;
      })
      .join("");
    
    // Setup expand/collapse functionality after locations are rendered
    setupLocationCardExpansion();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<li class="wiki-item">Unable to load locations.json</li>`;
  }
}


// =====================================================
// WEAPON CARD EXPAND/COLLAPSE
// =====================================================
function setupWeaponCardExpansion() {
  const weaponsContainer = document.getElementById("wikiWeaponsContainer");
  if (!weaponsContainer) return;

  weaponsContainer.querySelectorAll(".wiki-weapon-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on a link or icon
      if (e.target.closest("a") || e.target.closest(".wiki-card-icon")) {
        return;
      }
      
      // Close all other weapon cards before toggling this one
      weaponsContainer.querySelectorAll(".wiki-weapon-card").forEach((other) => {
        if (other !== card) {
          other.classList.remove("expanded");
        }
      });
      
      // Toggle expanded state on clicked card
      card.classList.toggle("expanded");
    });
  });
}

// =====================================================
// ITEM CARD EXPAND/COLLAPSE
// =====================================================
function setupItemCardExpansion() {
  const itemsContainer = document.getElementById("wikiItemsContainer");
  if (!itemsContainer) return;

  itemsContainer.querySelectorAll(".wiki-item-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on a link or icon
      if (e.target.closest("a") || e.target.closest(".wiki-card-icon")) {
        return;
      }
      
      // Don't trigger if clicking on a drop source card (for future interactivity)
      if (e.target.closest(".wiki-drop-source-card")) {
        return;
      }
      
      // Close all other item cards before toggling this one
      itemsContainer.querySelectorAll(".wiki-item-card").forEach((other) => {
        if (other !== card) {
          other.classList.remove("expanded");
        }
      });
      
      // Toggle expanded state on clicked card
      card.classList.toggle("expanded");
    });
  });
}

// =====================================================
// ENEMY CARD EXPAND/COLLAPSE
// =====================================================
function setupEnemyCardExpansion() {
  const enemiesContainer = document.getElementById("wikiEnemiesContainer");
  if (!enemiesContainer) return;

  enemiesContainer.querySelectorAll(".wiki-enemy-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on a link or icon
      if (e.target.closest("a") || e.target.closest(".wiki-card-icon")) {
        return;
      }
      
      // Close all other enemy cards before toggling this one
      enemiesContainer.querySelectorAll(".wiki-enemy-card").forEach((other) => {
        if (other !== card) {
          other.classList.remove("expanded");
        }
      });
      
      // Toggle expanded state on clicked card
      card.classList.toggle("expanded");
    });
  });
}

// =====================================================
// PACT CARD EXPAND/COLLAPSE
// =====================================================
function setupPactCardExpansion() {
  const pactsContainer = document.getElementById("wikiPactsContainer");
  if (!pactsContainer) return;

  pactsContainer.querySelectorAll(".wiki-pact-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on a link or icon
      if (e.target.closest("a") || e.target.closest(".wiki-card-icon")) {
        return;
      }
      
      // Close all other pact cards before toggling this one
      pactsContainer.querySelectorAll(".wiki-pact-card").forEach((other) => {
        if (other !== card) {
          other.classList.remove("expanded");
        }
      });
      
      // Toggle expanded state on clicked card
      card.classList.toggle("expanded");
    });
  });
}

// =====================================================
// LOCATION CARD EXPAND/COLLAPSE
// =====================================================
function setupLocationCardExpansion() {
  const locationsContainer = document.getElementById("wikiLocationsContainer");
  if (!locationsContainer) return;

  locationsContainer.querySelectorAll(".wiki-location-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicking on a link or icon
      if (e.target.closest("a") || e.target.closest(".wiki-card-icon")) {
        return;
      }
      
      // Close all other location cards before toggling this one
      locationsContainer.querySelectorAll(".wiki-location-card").forEach((other) => {
        if (other !== card) {
          other.classList.remove("expanded");
        }
      });
      
      // Toggle expanded state on clicked card
      card.classList.toggle("expanded");
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

  //applyTab("all");
  // Default: show Items only
  applyTab("items");
  
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
    const query = searchInput.value.toLowerCase().trim();

    const allItems = document.querySelectorAll(".wiki-list .wiki-item");
    const panels = document.querySelectorAll(".wiki-panel");
    if (!allItems.length || !panels.length) return;

    const tabs = document.querySelectorAll(".wiki-tab");
    const allTab = document.querySelector('.wiki-tab[data-target="all"]');

    // --- No query: restore normal tab behavior ---
    if (!query) {
      // Which tab is currently active?
      const activeTab = document.querySelector(".wiki-tab.active");
      const key = activeTab ? (activeTab.dataset.target || "all") : "items";

      panels.forEach((panel) => {
        const panelKey = panel.dataset.panel;
        const hide = key !== "all" && panelKey !== key;
        panel.dataset.hidden = hide ? "true" : "false";
        panel.style.display = hide ? "none" : "";
      });

      // Show all items inside the visible panels
      allItems.forEach((item) => {
        item.style.display = "";
      });

      return;
    }

    // --- With a query: behave like the "All" tab ---

    // Visually set the All tab active
    tabs.forEach((tab) => {
      const isAll = tab === allTab;
      tab.classList.toggle("active", isAll);
    });

    // Show all panels while searching
    panels.forEach((panel) => {
      panel.dataset.hidden = "false";
      panel.style.display = "";
    });

    // Filter each item by text
    allItems.forEach((item) => {
      const text = (item.textContent || "").toLowerCase();
      item.style.display = text.includes(query) ? "" : "none";
    });
  });
}

// =====================================================
// WIKI IMAGE POPUP
// =====================================================
function setupWikiImageModal() {
  const modal = document.getElementById("wikiImageModal");
  const imgEl = document.getElementById("wikiModalImage");
  const closeBtn = document.getElementById("wikiModalClose");
  if (!modal || !imgEl || !closeBtn) return;

  const openModal = (src, altText) => {
    if (!src) return;
    imgEl.src = src;
    imgEl.alt = altText || "";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    imgEl.src = "";
    imgEl.alt = "";
  };

  closeBtn.addEventListener("click", closeModal);

  // Click on backdrop closes modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });

  // Click on any wiki icon -> open zoomed image
  // We limit to the icon area so card click behavior remains intact
  document.addEventListener("click", (e) => {
    const iconWrapper = e.target.closest(".wiki-card-icon, .wiki-item-icon");
    if (!iconWrapper) return;

    const img = iconWrapper.querySelector("img");
    if (!img || !img.src) return;

    e.preventDefault();
    e.stopPropagation();

    const titleNode =
      iconWrapper
        .closest(".wiki-item, .wiki-card")
        ?.querySelector(".wiki-item-name, .wiki-card-title") || null;

    const altText = img.alt || (titleNode ? titleNode.textContent.trim() : "");

    openModal(img.src, altText);
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

let buildDataLoaded = false;
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
    renderWikiWeapons(),
    renderWikiEnemies(),
    renderWikiPacts(),
    renderWikiLocations(),
    renderRegions(),
    renderBuildLab()
  ]);

  setupGuideFilters();
  setupGuideSearch();
  setupWikiTabs();
  setupWikiSearch();
  setupWikiImageModal();
})();














