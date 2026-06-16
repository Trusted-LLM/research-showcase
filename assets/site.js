const search = document.getElementById("paper-search");
const list = document.getElementById("paper-list");
const empty = document.getElementById("empty-state");

if (search && list) {
  const cards = [...list.querySelectorAll(".paper-card")];
  const applySearch = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matched = !query || card.dataset.search.includes(query);
      card.hidden = !matched;
      if (matched) visible += 1;
    });
    if (empty) empty.style.display = visible ? "none" : "block";
  };
  search.addEventListener("input", applySearch);
}
