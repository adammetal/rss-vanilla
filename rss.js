const ARTICLE_KEY = "saved-news";

function loadArticles() {
  const raw = localStorage.getItem(ARTICLE_KEY);
  if (!raw) {
    return [];
  } else {
    return JSON.parse(raw);
  }
}

function saveArticles() {
  const raw = JSON.stringify(state.saved);
  localStorage.setItem(ARTICLE_KEY, raw);
}

function removeArticle(url) {
  const articles = loadArticles();
  const nextArticles = articles.filter((a) => {
    return a.link !== url;
  });
  state.saved = nextArticles;
}

function parseHtml(str) {
  const parser = new DOMParser();
  return parser.parseFromString(str, "text/html");
}

function parseXml(str) {
  const parser = new DOMParser();
  return parser.parseFromString(str, "text/xml");
}

function parseNews(newsDomTree) {
  const items = newsDomTree.getElementsByTagName("item");
  const news = [];
  for (const item of items) {
    const title = item.getElementsByTagName("title")[0].textContent;
    let desc = item.getElementsByTagName("description")[0].textContent;
    const link = item.getElementsByTagName("link")[0].textContent;

    desc = parseHtml(desc).body.textContent.substring(0, 250) + "...";

    news.push({ title, desc, link });
  }
  return news;
}

function News(news, onDelete) {
  const itemDivs = [];
  for (const item of news) {
    const title = item.title;
    let desc = item.desc;
    const link = item.link;

    const itemDiv = Item(
      { title, desc, link },
      () => {
        state.saved.push({ title, desc, link });
        saveArticles();
        renderApplication();
      },
      onDelete
    );

    itemDivs.push(itemDiv);
  }
  return itemDivs;
}

function Item(item, onSave, onDelete) {
  const title = item.title;
  const desc = item.desc;
  const link = item.link;

  const div = document.createElement("div");
  div.className = "item";

  const titleEl = document.createElement("h1");
  titleEl.textContent = title;

  const descDiv = document.createElement("div");
  descDiv.textContent = desc;

  const linkEl = document.createElement("a");
  linkEl.href = link;
  linkEl.textContent = link;

  div.append(titleEl, descDiv, linkEl);

  if (onSave) {
    const save = document.createElement("button");
    save.innerText = "Save";

    save.onclick = onSave;

    const saveDiv = document.createElement("div");
    saveDiv.append(save);
    div.append(saveDiv);
  }

  if (onDelete) {
    const del = document.createElement("button");
    del.innerText = "Delete";

    del.onclick = () => onDelete(link);

    const delDiv = document.createElement("div");
    delDiv.append(del);
    div.append(delDiv);
  }

  return div;
}

const state = {
  news: [],
  saved: loadArticles(),
};

const effects = [];

const effect = (name, cb) => {
  if (!effects.includes(name)) {
    effects.push(name);
    cb();
  }
};

function NewsContainer() {
  effect("fetchFeed", () => {
    fetch("https://dev.to/feed/")
      .then((res) => res.text())
      .then((res) => parseXml(res))
      .then((res) => parseNews(res))
      .then((news) => {
        state.news = news;
        renderApplication();
      });
  });

  const items = News(state.news);
  return items;
}

function SavedContainer() {
  const items = News(state.saved, (link) => {
    removeArticle(link);
    renderApplication();
    saveArticles();
  });
  return items;
}

function renderApplication() {
  const main = document.querySelector("#main");
  const saved = document.querySelector("#saved");

  main.innerHTML = "";
  saved.innerHTML = "";

  main.append(...NewsContainer());
  saved.append(...SavedContainer());
}

renderApplication();
