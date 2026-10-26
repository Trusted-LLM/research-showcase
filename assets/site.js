const search = document.getElementById("paper-search");
const list = document.getElementById("paper-list");
const empty = document.getElementById("empty-state");
const filterStatus = document.getElementById("paper-filter-status");
const chipsBox = document.getElementById("active-chips");
const sortSelect = document.getElementById("paper-sort");
const authorSelect = document.getElementById("author-filter");
const clearBtn = document.getElementById("clear-filters");
const emptyClear = document.getElementById("empty-clear");
const toTop = document.getElementById("to-top");
const yearButtons = [...document.querySelectorAll(".year-filter[data-year], .timeline-clear[data-year]")];
const topicButtons = [...document.querySelectorAll("[data-topic-filter]")];

const norm = (v) => (v || "").trim();
const yearOf = (card) => norm(card.querySelector(".paper-year")?.textContent);
const titleOf = (card) => norm(card.querySelector("h3")?.textContent);
const venueOf = (card) => {
  const pub = card.querySelector(".paper-pub");
  if (!pub) return "";
  const clone = pub.cloneNode(true);
  clone.querySelectorAll("span").forEach((n) => n.remove());
  return norm(clone.textContent).split(" · ")[0];
};

if (search && list) {
  const cards = [...list.querySelectorAll(".paper-card")];
  const dividers = [...list.querySelectorAll(".year-divider")];
  const originalOrder = cards.slice();
  const dividerFor = new Map(dividers.map((d) => [d.dataset.year, d]));

  let activeYear = "";
  let activeTopic = "";
  let activeTopicLabel = "";
  let activeAuthor = "";
  let sortMode = "year-desc";

  if (authorSelect) {
    const counter = new Map();
    cards.forEach((card) => {
      norm(card.dataset.authors).split(";").map(norm).filter(Boolean).forEach((a) => {
        counter.set(a, (counter.get(a) || 0) + 1);
      });
    });
    [...counter.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([name, n]) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = n > 1 ? `${name}（${n}）` : name;
        authorSelect.append(opt);
      });
  }

  const bibKey = (card) => {
    const authors = norm(card.dataset.authors).split(";").map(norm).filter(Boolean);
    const last = authors.length ? authors[0].split(/\s+/).pop() : "ref";
    const words = titleOf(card).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3);
    return [last.replace(/[^A-Za-z]/g, "").toLowerCase(), yearOf(card), ...words.slice(0, 2)].join("");
  };
  const bibText = (card) => {
    const authors = norm(card.dataset.authors).split(";").map(norm).filter(Boolean).join(" and ");
    const venue = venueOf(card);
    const journalish = /Transactions|Journal|Letters|Review|Magazine/i.test(venue);
    const type = journalish ? "article" : "inproceedings";
    const field = journalish ? "journal" : "booktitle";
    const pad = (f) => (f.length >= 9 ? f : f + " ".repeat(9 - f.length));
    return [
      `@${type}{${bibKey(card)},`,
      `  title     = {${titleOf(card)}},`,
      `  author    = {${authors}},`,
      `  ${pad(field)} = {${venue}},`,
      `  year      = {${yearOf(card)}}`,
      "}",
    ].join("\n");
  };
  cards.forEach((card) => {
    const actions = card.querySelector(".paper-actions") || card.querySelector(".paper-body");
    if (!actions || !card.querySelector(".paper-pub")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bib-copy";
    btn.textContent = "复制 BibTeX";
    btn.addEventListener("click", async () => {
      const text = bibText(card);
      let ok = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch (e) {
          ok = false;
        }
      }
      if (!ok && typeof document.execCommand === "function") {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.append(ta);
          ta.select();
          ok = document.execCommand("copy");
          ta.remove();
        } catch (e) {
          ok = false;
        }
      }
      btn.textContent = ok ? "已复制" : "复制未授权";
      setTimeout(() => (btn.textContent = "复制 BibTeX"), 1600);
    });
    actions.append(btn);
  });

  const writeUrl = () => {
    const p = new URLSearchParams();
    if (activeYear) p.set("y", activeYear);
    if (activeTopic) p.set("t", activeTopic);
    if (activeAuthor) p.set("a", activeAuthor);
    if (norm(search.value)) p.set("q", norm(search.value));
    if (sortMode !== "year-desc") p.set("s", sortMode);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `${location.pathname}?${qs}` : location.pathname);
  };

  const applyFilters = () => {
    const query = norm(search.value).toLocaleLowerCase();
    let visible = 0;
    const visiblePerYear = new Map();

    cards.forEach((card) => {
      const authors = norm(card.dataset.authors).split(";").map(norm);
      const matched =
        (!activeYear || yearOf(card) === activeYear) &&
        (!activeTopic || card.dataset.topic === activeTopic) &&
        (!activeAuthor || authors.includes(activeAuthor)) &&
        (!query || card.dataset.search.includes(query));
      card.hidden = !matched;
      if (matched) {
        visible += 1;
        const y = yearOf(card);
        visiblePerYear.set(y, (visiblePerYear.get(y) || 0) + 1);
      }
    });

    dividers.forEach((d) => {
      const n = visiblePerYear.get(d.dataset.year) || 0;
      const grouped = sortMode === "year-desc" || sortMode === "year-asc";
      d.hidden = !grouped || n === 0;
      const span = d.querySelector("span");
      if (span) span.textContent = `${n} 篇`;
    });

    if (empty) empty.style.display = visible ? "none" : "block";

    if (filterStatus) {
      const filters = [];
      if (activeYear) filters.push(`${activeYear} 年`);
      if (activeTopicLabel) filters.push(activeTopicLabel);
      if (activeAuthor) filters.push(`作者 ${activeAuthor}`);
      if (query) filters.push(`搜索“${norm(search.value)}”`);
      filterStatus.textContent = filters.length
        ? `${filters.join(" · ")}：显示 ${visible} 篇论文`
        : `显示全部 ${visible} 篇论文`;
    }
    renderChips(query);
    writeUrl();
  };

  const renderChips = (query) => {
    if (!chipsBox) return;
    chipsBox.textContent = "";
    const add = (label, onRemove) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = label;
      b.addEventListener("click", onRemove);
      chipsBox.append(b);
    };
    if (activeYear) add(`年份 ${activeYear}`, () => selectYear(""));
    if (activeTopic && activeTopicLabel) add(`方向 ${activeTopicLabel}`, () => selectTopic(activeTopic, activeTopicLabel));
    if (activeAuthor) add(`作者 ${activeAuthor}`, () => { activeAuthor = ""; if (authorSelect) authorSelect.value = ""; applyFilters(); });
    if (query) add(`搜索 ${norm(search.value)}`, () => { search.value = ""; applyFilters(); });
  };

  const reorder = (mode) => {
    const frag = document.createDocumentFragment();
    if (mode === "year-desc" || mode === "year-asc") {
      const groups = new Map();
      originalOrder.forEach((c) => {
        const y = yearOf(c);
        if (!groups.has(y)) groups.set(y, []);
        groups.get(y).push(c);
      });
      const keys = [...groups.keys()].sort((a, b) => (mode === "year-desc" ? Number(b) - Number(a) : Number(a) - Number(b)));
      keys.forEach((y) => {
        const d = dividerFor.get(y);
        if (d) frag.append(d);
        groups.get(y).forEach((c) => frag.append(c));
      });
    } else {
      const pick = mode === "title-asc" ? titleOf : venueOf;
      originalOrder.slice().sort((a, b) => pick(a).localeCompare(pick(b), "en")).forEach((c) => frag.append(c));
      dividers.forEach((d) => frag.append(d));
    }
    list.append(frag);
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

  const clearAll = () => {
    activeYear = "";
    activeTopic = "";
    activeTopicLabel = "";
    activeAuthor = "";
    search.value = "";
    if (authorSelect) authorSelect.value = "";
    sortMode = "year-desc";
    if (sortSelect) sortSelect.value = sortMode;
    yearButtons.forEach((b) => {
      const selected = !b.dataset.year;
      b.classList.toggle("is-active", selected);
      b.setAttribute("aria-pressed", String(selected));
    });
    topicButtons.forEach((b) => {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });
    reorder(sortMode);
    applyFilters();
  };

  yearButtons.forEach((button) => {
    button.addEventListener("click", () => selectYear(button.dataset.year));
  });
  topicButtons.forEach((button) => {
    button.addEventListener("click", () => selectTopic(button.dataset.topicFilter, button.dataset.topicLabel));
  });
  search.addEventListener("input", applyFilters);
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      sortMode = sortSelect.value;
      reorder(sortMode);
      applyFilters();
    });
  }
  if (authorSelect) {
    authorSelect.addEventListener("change", () => {
      activeAuthor = authorSelect.value;
      applyFilters();
    });
  }
  if (clearBtn) clearBtn.addEventListener("click", clearAll);
  if (emptyClear) emptyClear.addEventListener("click", clearAll);

  document.addEventListener("keydown", (e) => {
    const el = document.activeElement;
    const typing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      search.focus();
    } else if (e.key === "Escape" && typing) {
      if (el === search) {
        search.value = "";
        applyFilters();
      }
      el.blur();
    }
  });

  const q = new URLSearchParams(location.search);
  if (q.get("y")) activeYear = q.get("y");
  if (q.get("t")) {
    activeTopic = q.get("t");
    const btn = topicButtons.find((b) => b.dataset.topicFilter === activeTopic);
    activeTopicLabel = btn ? btn.dataset.topicLabel : activeTopic;
  }
  if (q.get("a")) activeAuthor = q.get("a");
  if (q.get("q")) search.value = q.get("q");
  if (q.get("s")) sortMode = q.get("s");
  yearButtons.forEach((b) => {
    const selected = (b.dataset.year || "") === activeYear;
    b.classList.toggle("is-active", selected);
    b.setAttribute("aria-pressed", String(selected));
  });
  topicButtons.forEach((b) => {
    const selected = b.dataset.topicFilter === activeTopic;
    b.classList.toggle("is-active", selected);
    b.setAttribute("aria-pressed", String(selected));
  });
  if (authorSelect) authorSelect.value = activeAuthor;
  if (sortSelect) sortSelect.value = sortMode;
  reorder(sortMode);
  applyFilters();
}

if (toTop) {
  const toggle = () => (toTop.hidden = window.scrollY < 700);
  window.addEventListener("scroll", toggle, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  toggle();
}
