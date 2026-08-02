const search = document.getElementById("paper-search");
const list = document.getElementById("paper-list");
const empty = document.getElementById("empty-state");
const filterStatus = document.getElementById("paper-filter-status");
const yearButtons = [...document.querySelectorAll("[data-year]")];
const topicButtons = [...document.querySelectorAll("[data-topic-filter]")];

if (search && list) {
  const cards = [...list.querySelectorAll(".paper-card")];
  let activeYear = "";
  let activeTopic = "";
  let activeTopicLabel = "";

  const applyFilters = () => {
    const rawQuery = search.value.trim();
    const query = rawQuery.toLocaleLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const cardYear = card.querySelector(".paper-year")?.textContent.trim();
      const matchesYear = !activeYear || cardYear === activeYear;
      const matchesTopic = !activeTopic || card.dataset.topic === activeTopic;
      const matchesQuery = !query || card.dataset.search.includes(query);
      const matched = matchesYear && matchesTopic && matchesQuery;
      card.hidden = !matched;
      if (matched) visible += 1;
    });
    if (empty) empty.style.display = visible ? "none" : "block";

    if (filterStatus) {
      const filters = [];
      if (activeYear) filters.push(`${activeYear} 年`);
      if (activeTopicLabel) filters.push(activeTopicLabel);
      if (rawQuery) filters.push(`搜索“${rawQuery}”`);
      filterStatus.textContent = filters.length
        ? `${filters.join(" · ")}：显示 ${visible} 篇论文`
        : `显示全部 ${visible} 篇论文`;
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

  const selectTopic = (topic, label) => {
    const isSameTopic = activeTopic === topic;
    activeTopic = isSameTopic ? "" : topic;
    activeTopicLabel = isSameTopic ? "" : label;
    topicButtons.forEach((button) => {
      const selected = button.dataset.topicFilter === activeTopic;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    applyFilters();
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  yearButtons.forEach((button) => {
    button.addEventListener("click", () => selectYear(button.dataset.year));
  });
  topicButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectTopic(button.dataset.topicFilter, button.dataset.topicLabel);
    });
  });
  search.addEventListener("input", applyFilters);
}
