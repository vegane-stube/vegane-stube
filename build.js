const fs = require("fs");
const path = require("path");

const root = __dirname;
const languages = {
  de: {
    recipeRoot: "de/rezepte",
    collectionTitle: "Rezepte",
    collectionEyebrow: "Die Sammlung",
    collectionIntro: "Vegane Gerichte, inspiriert von Südtirol. Traditionell, modern und mit Raum für eigene Ideen.",
    back: "Zur Rezeptsammlung",
    ingredients: "Zutaten",
    method: "Zubereitung",
    servings: "Für",
    contributor: "Von",
    allergens: "Allergene",
    contribute: "Mitmachen",
    legal: "Impressum",
    categoryLabels: { first: "Erster Gang", second: "Hauptgericht", dessert: "Dessert" }
  },
  it: {
    recipeRoot: "it/ricette",
    collectionTitle: "Ricette",
    collectionEyebrow: "La raccolta",
    collectionIntro: "Piatti vegani ispirati all’Alto Adige. Tradizionali, moderni e aperti alle idee personali.",
    back: "Torna alle ricette",
    ingredients: "Ingredienti",
    method: "Preparazione",
    servings: "Per",
    contributor: "Di",
    allergens: "Allergeni",
    contribute: "Collabora",
    legal: "Note legali",
    categoryLabels: { first: "Primo", second: "Secondo", dessert: "Dessert" }
  },
  en: {
    recipeRoot: "en/recipes",
    collectionTitle: "Recipes",
    collectionEyebrow: "The collection",
    collectionIntro: "Vegan dishes inspired by South Tyrol. Traditional, modern, and open to original ideas.",
    back: "Back to recipes",
    ingredients: "Ingredients",
    method: "Method",
    servings: "Serves",
    contributor: "By",
    allergens: "Allergens",
    contribute: "Contribute",
    legal: "Legal notice",
    categoryLabels: { first: "First course", second: "Main course", dessert: "Dessert" }
  }
};

const categoryIds = new Set(["first", "second", "dessert"]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function readRecipes(language, config) {
  const collectionPath = path.join(root, config.recipeRoot);
  return fs.readdirSync(collectionPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const slug = entry.name.slice(0, -".json".length);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(`${language}/${slug}: filename must use lowercase letters, numbers, and hyphens`);
      }
      const recipe = JSON.parse(fs.readFileSync(path.join(collectionPath, entry.name), "utf8"));
      validateRecipe(language, slug, recipe, collectionPath);
      return { slug, ...recipe };
    });
}

function validateRecipe(language, slug, recipe, collectionPath) {
  const required = ["title", "category", "description", "servings", "total_time", "ingredients", "steps", "allergens"];
  const missing = required.filter((field) => recipe[field] === undefined);
  if (missing.length) throw new Error(`${language}/${slug}: missing ${missing.join(", ")}`);
  if (!categoryIds.has(recipe.category)) throw new Error(`${language}/${slug}: invalid category "${recipe.category}"`);
  if (!isNonEmptyString(recipe.title) || !isNonEmptyString(recipe.description)) {
    throw new Error(`${language}/${slug}: title and description must be non-empty strings`);
  }
  if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) {
    throw new Error(`${language}/${slug}: servings must be a positive number`);
  }
  if (!recipe.total_time || typeof recipe.total_time !== "object" ||
      !Number.isFinite(recipe.total_time.value) || recipe.total_time.value <= 0 ||
      !isNonEmptyString(recipe.total_time.unit)) {
    throw new Error(`${language}/${slug}: total_time needs a numeric value and unit`);
  }
  if (!Array.isArray(recipe.ingredients) || !recipe.ingredients.length) {
    throw new Error(`${language}/${slug}: ingredients must be a non-empty array`);
  }
  recipe.ingredients.forEach((ingredient, index) => {
    if (!ingredient || typeof ingredient !== "object" ||
        (typeof ingredient.amount !== "number" && typeof ingredient.amount !== "string") ||
        typeof ingredient.unit !== "string" || !isNonEmptyString(ingredient.name)) {
      throw new Error(`${language}/${slug}: invalid ingredient at index ${index}`);
    }
  });
  if (!Array.isArray(recipe.steps) || !recipe.steps.length ||
      recipe.steps.some((step) => !isNonEmptyString(step))) {
    throw new Error(`${language}/${slug}: steps must be a non-empty array`);
  }
  if (!Array.isArray(recipe.allergens) || !recipe.allergens.length ||
      recipe.allergens.some((allergen) => !isNonEmptyString(allergen))) {
    throw new Error(`${language}/${slug}: allergens must be a non-empty array`);
  }
  if (recipe.rights_confirmed !== true) {
    throw new Error(`${language}/${slug}: rights_confirmed must be true`);
  }
  if (!recipe.contributor || typeof recipe.contributor !== "object" ||
      typeof recipe.contributor.name !== "string") {
    throw new Error(`${language}/${slug}: contributor.name must be a string`);
  }
  const photoPath = path.join(collectionPath, `${slug}.jpg`);
  if (!fs.existsSync(photoPath)) {
    throw new Error(`${language}/${slug}: missing required photo ${slug}.jpg`);
  }
  const photo = fs.readFileSync(photoPath);
  if (photo.length < 3 || photo[0] !== 0xff || photo[1] !== 0xd8 || photo[2] !== 0xff) {
    throw new Error(`${language}/${slug}: ${slug}.jpg is not a valid JPEG file`);
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function collectionPage(language, config, recipes) {
  const languageRoot = "../../";
  const homeLinks = {
    de: "../../de/",
    it: "../../it/",
    en: "../../en/"
  };
  const collectionLinks = {
    de: "../../de/rezepte/",
    it: "../../it/ricette/",
    en: "../../en/recipes/"
  };
  const contributionLinks = {
    de: "../../de/mitmachen/",
    it: "../../it/mitmachen/",
    en: "../../en/contribute/"
  };
  const legalLinks = {
    de: "../../de/impressum/",
    it: "../../it/legal/",
    en: "../../en/legal/"
  };
  const cards = recipes.map((recipe) => `
      <a class="recipe-card" data-category="${escapeHtml(recipe.category)}" data-title="${escapeHtml(recipe.title.toLocaleLowerCase())}" href="?recipe=${encodeURIComponent(recipe.slug)}">
        <span class="recipe-meta">${escapeHtml(config.categoryLabels[recipe.category])}</span>
        <h2>${escapeHtml(recipe.title)}</h2>
        <p>${escapeHtml(recipe.description)}</p>
      </a>`).join("");

  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(config.collectionIntro)}">
  <title>${config.collectionTitle} – Vegane Stube</title>
  <link rel="stylesheet" href="${languageRoot}assets/site.css?v=3">
</head>
<body>
  <header class="site-header"><a class="site-title" href="${homeLinks[language]}">Vegane Stube</a><nav aria-label="${language === "de" ? "Sprache" : language === "it" ? "Lingua" : "Language"}"><a href="${collectionLinks.de}"${language === "de" ? ' aria-current="page"' : ""}>DE</a><a href="${collectionLinks.it}"${language === "it" ? ' aria-current="page"' : ""}>IT</a><a href="${collectionLinks.en}"${language === "en" ? ' aria-current="page"' : ""}>EN</a></nav></header>
  <main class="page" data-collection-page>
    <p class="eyebrow">${config.collectionEyebrow}</p>
    <h1>${config.collectionTitle}</h1>
    <p class="intro">${escapeHtml(config.collectionIntro)}</p>
    <div class="collection-tools">
      <input id="recipe-search" type="search" aria-label="${language === "de" ? "Nach Titel suchen" : language === "it" ? "Cerca per titolo" : "Search by title"}" placeholder="${language === "de" ? "Suchen" : language === "it" ? "Cerca" : "Search"}" autocomplete="off">
      <div class="category-filters" role="group" aria-label="${language === "de" ? "Kategorien filtern" : language === "it" ? "Filtra per categoria" : "Filter by category"}">
        <button type="button" class="filter-button is-active" data-category-filter="all">${language === "de" ? "Alle" : language === "it" ? "Tutte" : "All"}</button>
        <button type="button" class="filter-button" data-category-filter="first">${escapeHtml(config.categoryLabels.first)}</button>
        <button type="button" class="filter-button" data-category-filter="second">${escapeHtml(config.categoryLabels.second)}</button>
        <button type="button" class="filter-button" data-category-filter="dessert">${escapeHtml(config.categoryLabels.dessert)}</button>
      </div>
      <p class="filter-empty" hidden>${language === "de" ? "Keine passenden Rezepte." : language === "it" ? "Nessuna ricetta corrispondente." : "No matching recipes."}</p>
    </div>
    <div class="recipe-list">${cards || `<p>${language === "de" ? "Noch keine Rezepte." : language === "it" ? "Ancora nessuna ricetta." : "No recipes yet."}</p>`}</div>
  </main>
  <main class="page" data-recipe-page hidden>
    <a class="back-link" href="./">← ${config.back}</a>
    <p class="eyebrow" data-category></p>
    <h1 data-title></h1>
    <img class="recipe-image" data-recipe-image hidden>
    <p class="recipe-intro" data-description></p>
    <p class="recipe-meta" data-contributor></p>
    <p class="recipe-meta">${config.servings} <span data-servings></span> · <span data-time></span></p>
    <p class="recipe-note"><strong>${config.allergens}:</strong> ${language === "de" ? "Soja und Gluten können je nach verwendeten Produkten enthalten sein. Zutaten bitte immer prüfen." : language === "it" ? "Soia e glutine possono essere presenti a seconda dei prodotti utilizzati. Controllare sempre gli ingredienti." : "Soy and gluten may be present depending on the products used. Always check the ingredients."}</p>
    <div class="recipe-layout"><section><h2>${config.ingredients}</h2><ul data-ingredients></ul><h2>${config.method}</h2><ol data-steps></ol></section></div>
  </main>
  <p class="page notice" data-error hidden>${language === "de" ? "Das Rezept konnte nicht geladen werden." : language === "it" ? "Impossibile caricare la ricetta." : "The recipe could not be loaded."}</p>
  <footer class="site-footer"><a href="${contributionLinks[language]}">${config.contribute}</a><a href="${legalLinks[language]}">${config.legal}</a></footer>
  <script src="${languageRoot}assets/collection.js?v=1"></script>
  <script src="${languageRoot}assets/recipe.js?v=10"></script>
</body>
</html>
`;
}

for (const [language, config] of Object.entries(languages)) {
  const recipes = readRecipes(language, config);
  fs.writeFileSync(path.join(root, config.recipeRoot, "index.html"), collectionPage(language, config, recipes));
  console.log(`${language}: generated collection and recipe viewer in index.html for ${recipes.length} recipe(s)`);
}
