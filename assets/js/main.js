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
