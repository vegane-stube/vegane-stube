(async function () {
  const page = document.querySelector("[data-recipe-page]");
  const slug = new URLSearchParams(window.location.search).get("recipe");
  const language = window.location.pathname.split("/").filter(Boolean)[0] || "de";
  const categoryLabels = {
    de: {
      first: "Erster Gang",
      second: "Hauptgericht",
      dessert: "Dessert"
    },
    it: {
      first: "Primo",
      second: "Secondo",
      dessert: "Dessert"
    },
    en: {
      first: "First course",
      second: "Main course",
      dessert: "Dessert"
    }
  };
  const contributorLabels = {
    de: { label: "Von", anonymous: "anonym" },
    it: { label: "Di", anonymous: "anonimo" },
    en: { label: "By", anonymous: "anonymous" }
  };

  if (!slug) {
    return;
  }

  try {
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      throw new Error("Missing or invalid recipe slug");
    }
    const response = await fetch(`${slug}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Recipe data returned ${response.status}`);
    const recipe = await response.json();
    const languageRoots = {
      de: "../../de/rezepte/",
      it: "../../it/ricette/",
      en: "../../en/recipes/"
    };
    const languageCodes = ["de", "it", "en"];
    document.querySelectorAll("nav a").forEach((link, index) => {
      link.href = `${languageRoots[languageCodes[index]]}?recipe=${encodeURIComponent(slug)}`;
    });
    document.querySelector("[data-collection-page]").hidden = true;

    document.title = `${recipe.title} – Vegane Stube`;
    const labels = categoryLabels[language] || categoryLabels.de;
    document.querySelector("[data-category]").textContent = labels[recipe.category] || recipe.category;
    document.querySelector("[data-title]").textContent = recipe.title;
    document.querySelector("[data-description]").textContent = recipe.description;
    const contributorName = recipe.contributor && typeof recipe.contributor.name === "string"
      ? recipe.contributor.name.trim()
      : "";
    const contributorText = contributorLabels[language] || contributorLabels.de;
    document.querySelector("[data-contributor]").textContent =
      `${contributorText.label} ${contributorName || contributorText.anonymous}`;
    document.querySelector("[data-servings]").textContent = recipe.servings;
    document.querySelector("[data-time]").textContent =
      `${recipe.total_time.value} ${recipe.total_time.unit}`;
    document.querySelector("[data-ingredients]").innerHTML = recipe.ingredients
      .map((ingredient) => {
        if (typeof ingredient === "string") return `<li>${ingredient}</li>`;
        return `<li>${ingredient.amount} ${ingredient.unit} ${ingredient.name}</li>`;
      }).join("");
    document.querySelector("[data-steps]").innerHTML = recipe.steps
      .map((step) => `<li>${step}</li>`).join("");
    const image = document.querySelector("[data-recipe-image]");
    image.src = `${slug}.jpg`;
    image.alt = recipe.title;
    image.addEventListener("load", () => image.hidden = false);
    image.addEventListener("error", () => {
      image.src = "../../assets/recipe-placeholder.svg";
      image.hidden = false;
    }, { once: true });
    page.hidden = false;
  } catch (error) {
    document.querySelector("[data-error]").hidden = false;
    console.error("Could not load recipe:", error);
  }
})();
