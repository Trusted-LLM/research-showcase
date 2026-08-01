const search = document.getElementById("paper-search");
const list = document.getElementById("paper-list");
const empty = document.getElementById("empty-state");
const filterStatus = document.getElementById("paper-filter-status");
const yearButtons = [...document.querySelectorAll("[data-year]")];

if (search && list) {
  const cards = [...list.querySelectorAll(".paper-card")];
  let activeYear = "";

  const applyFilters = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const cardYear = card.querySelector(".paper-year")?.textContent.trim();
      const matchesYear = !activeYear || cardYear === activeYear;
      const matchesQuery = !query || card.dataset.search.includes(query);
      const matched = matchesYear && matchesQuery;
      card.hidden = !matched;
      if (matched) visible += 1;
    });
    if (empty) empty.style.display = visible ? "none" : "block";

    if (filterStatus) {
      if (activeYear && query) {
        filterStatus.textContent = `${activeYear} 年中有 ${visible} 篇论文匹配当前搜索`;
      } else if (activeYear) {
        filterStatus.textContent = `显示 ${activeYear} 年发表的 ${visible} 篇论文`;
      } else if (query) {
        filterStatus.textContent = `全部年份中有 ${visible} 篇论文匹配当前搜索`;
      } else {
        filterStatus.textContent = `显示全部 ${visible} 篇论文`;
      }
    }
  };

  const selectYear = (year) => {
    activeYear = year;
    yearButtons.forEach((button) => {
      const selected = button.dataset.year === activeYear;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    applyFilters();
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  yearButtons.forEach((button) => {
    button.addEventListener("click", () => selectYear(button.dataset.year));
  });
  search.addEventListener("input", applyFilters);
}
