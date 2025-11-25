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
// JSON helpers
// ------------------------
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) {
    console.error(`Failed to load ${path}`, res.status);
    throw new Error(`Failed to load ${path}`);
  }
  return await res.json();
}

// ------------------------
// Render Guides from data/guides.json
// ------------------------
async function renderGuides() {
  const container = document.getElementById("guideGrid");
  if (!container) return; // not on this page

  try {
    const guides = await loadJSON("data/guides.json");

    container.innerHTML = guides
      .map((g) => {
        const difficultyStars =
          "★".repeat(g.difficulty || 1) +
          "☆".repeat(Math.max(0, 3 - (g.difficulty || 1)));

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

// ------------------------
// Render Wiki items from data/items.json
// ------------------------
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

// ------------------------
// Render Wiki enemies from data/enemies.json
// ------------------------
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

// ------------------------
// Guide filters (called after renderGuides)
// ------------------------
function setupGuideFilters() {
  const guideFilterButtons = document.querySelectorAll(".pill-filter");
  const guideCards = document.querySelectorAll("#guideGrid .card");
  if (!guideFilterButtons.length || !guideCards.length) return;

  guideFilterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.getAttribute("data-filter");

      guideFilterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      guideCards.forEach((card) => {
        const tags = (card.getAttribute("data-tags") || "").split(/\s+/);
        if (filter === "all" || tags.includes(filter)) {
          card.style.display = "";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// ------------------------
// Wiki accordions (called after wiki render)
// ------------------------
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

// ------------------------
// Init: run everything appropriate for the current page
// ------------------------
(async function initAtlas() {
  // Render dynamic content
  await Promise.allSettled([
    renderGuides(),
    renderWikiItems(),
    renderWikiEnemies()
  ]);

  // Then wire up behaviors that depend on that content
  setupGuideFilters();
  setupWikiAccordions();
})();
