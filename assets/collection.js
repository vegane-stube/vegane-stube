(function () {
  const search = document.querySelector("#recipe-search");
  const cards = [...document.querySelectorAll(".recipe-card")];
  const filters = [...document.querySelectorAll("[data-category-filter]")];
  const empty = document.querySelector(".filter-empty");
  let activeCategory = "all";

  if (!search || !cards.length) return;

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const matchesCategory = activeCategory === "all" || card.dataset.category === activeCategory;
      const matchesTitle = !query || card.dataset.title.includes(query);
      const isVisible = matchesCategory && matchesTitle;
      card.hidden = !isVisible;
      if (isVisible) visible += 1;
    });

    empty.hidden = visible !== 0;
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.categoryFilter;
      filters.forEach((item) => item.classList.toggle("is-active", item === button));
      render();
    });
  });

  search.addEventListener("input", render);
})();
