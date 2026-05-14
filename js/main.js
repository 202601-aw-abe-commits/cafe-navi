document.addEventListener("DOMContentLoaded", async () => {
  const cards = Array.from(document.querySelectorAll(".cards-grid .cafe-card"));
  const resultCountValue = document.querySelector(".result-count strong");
  const pagination = document.querySelector(".pagination");
  const navViewLinks = Array.from(document.querySelectorAll(".topnav a[data-view]"));
  const authLink = document.querySelector(".topnav .auth-link");
  const perPage = 10;
  let currentPage = 1;
  let currentView = "all";
  let isLoggedIn = false;
  const configuredBase = window.CAFE_NAVI_API_BASE || "";
  const API_BASE = configuredBase.replace(/\/+$/, "");
  const apiUrl = (path) => `${API_BASE}${path}`;

  const getToken = () => localStorage.getItem("cafeNaviSessionToken") || "";
  const clearToken = () => localStorage.removeItem("cafeNaviSessionToken");
  const apiFetch = (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(apiUrl(path), { ...options, headers });
  };

  const getFilteredCards = () => {
    if (currentView === "favorites") {
      return cards.filter((card) => {
        const heart = card.querySelector(".heart");
        return heart?.classList.contains("is-favorite");
      });
    }
    return cards;
  };

  const updateResultCount = (count) => {
    if (resultCountValue) {
      resultCountValue.textContent = String(count);
    }
  };

  const renderPagination = (page, totalPages, visibleCount) => {
    if (!pagination) {
      return;
    }

    if (visibleCount <= perPage) {
      pagination.hidden = true;
      pagination.innerHTML = "";
      return;
    }

    pagination.hidden = false;

    const prevDisabled = page === 1 ? "disabled" : "";
    const nextDisabled = page === totalPages ? "disabled" : "";
    let pageButtons = "";

    for (let i = 1; i <= totalPages; i += 1) {
      const isCurrent = i === page ? "is-current" : "";
      pageButtons += `<button type="button" class="page-btn ${isCurrent}" data-page="${i}" aria-label="${i}ページへ">${i}</button>`;
    }

    pagination.innerHTML = `
      <button type="button" class="page-btn page-nav" data-page="${page - 1}" ${prevDisabled} aria-label="前のページへ">前へ</button>
      ${pageButtons}
      <button type="button" class="page-btn page-nav" data-page="${page + 1}" ${nextDisabled} aria-label="次のページへ">次へ</button>
    `;
  };

  const renderPage = (page) => {
    const visibleCards = getFilteredCards();
    const visibleCount = visibleCards.length;
    const totalPages = Math.max(1, Math.ceil(visibleCount / perPage));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const start = (safePage - 1) * perPage;
    const end = start + perPage;

    updateResultCount(visibleCount);

    cards.forEach((card) => {
      card.hidden = true;
    });

    visibleCards.forEach((card, index) => {
      card.hidden = index < start || index >= end;
    });

    currentPage = safePage;
    renderPagination(safePage, totalPages, visibleCount);
  };

  const setHeartState = (heart, isFavorite) => {
    heart.classList.toggle("is-favorite", isFavorite);
    heart.textContent = isFavorite ? "♥" : "♡";
    heart.setAttribute("aria-label", isFavorite ? "お気に入りから削除" : "お気に入りに追加");
  };

  const syncAuthUi = (userName) => {
    if (!authLink) {
      return;
    }
    if (userName) {
      authLink.textContent = `ログアウト (${userName})`;
      authLink.href = "#";
      authLink.dataset.mode = "logout";
    } else {
      authLink.textContent = "ログイン";
      authLink.href = "auth-choice.html";
      authLink.dataset.mode = "login";
    }
  };

  const fetchSession = async () => {
    try {
      const response = await apiFetch("/api/me");
      if (!response.ok) {
        isLoggedIn = false;
        syncAuthUi();
        return;
      }
      const data = await response.json();
      isLoggedIn = true;
      syncAuthUi(data?.user?.userName || "");
    } catch (_error) {
      isLoggedIn = false;
      syncAuthUi();
    }
  };

  const fetchFavorites = async () => {
    cards.forEach((card) => {
      const heart = card.querySelector(".heart");
      if (heart) {
        setHeartState(heart, false);
      }
    });

    if (!isLoggedIn) {
      renderPage(currentPage);
      return;
    }

    try {
      const response = await apiFetch("/api/favorites");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const favorites = new Set(data.favorites || []);
      cards.forEach((card) => {
        const heart = card.querySelector(".heart");
        if (!heart) {
          return;
        }
        const cafeCode = card.dataset.cafeId || "";
        setHeartState(heart, favorites.has(cafeCode));
      });
      renderPage(currentPage);
    } catch (_error) {
      // no-op
    }
  };

  if (authLink instanceof HTMLAnchorElement) {
    authLink.addEventListener("click", async (event) => {
      if (authLink.dataset.mode !== "logout") {
        return;
      }
      event.preventDefault();
      try {
        await apiFetch("/api/logout", { method: "POST" });
      } catch (_error) {
        // no-op
      }
      clearToken();
      isLoggedIn = false;
      syncAuthUi();
      await fetchFavorites();
      if (currentView === "favorites") {
        currentView = "all";
        navViewLinks.forEach((navLink) => {
          navLink.classList.toggle("is-active", navLink.dataset.view === "all");
        });
      }
      renderPage(1);
    });
  }

  if (pagination) {
    pagination.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) {
        return;
      }

      const page = Number(target.dataset.page);
      if (!Number.isNaN(page)) {
        renderPage(page);
      }
    });
  }

  navViewLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (link.dataset.view === "favorites" && !isLoggedIn) {
        window.location.href = "auth-choice.html";
        return;
      }
      currentView = link.dataset.view === "favorites" ? "favorites" : "all";
      navViewLinks.forEach((navLink) => {
        navLink.classList.remove("is-active");
      });
      link.classList.add("is-active");
      renderPage(1);
    });
  });

  cards.forEach((card) => {
    const heart = card.querySelector(".heart");
    if (!heart) {
      return;
    }

    heart.addEventListener("click", async (event) => {
      event.stopPropagation();

      if (!isLoggedIn) {
        window.location.href = "auth-choice.html";
        return;
      }

      const cafeCode = card.dataset.cafeId;
      const cafeName = card.querySelector(".title-row h3")?.textContent?.trim() || cafeCode || "";
      const area = card.querySelector(".meta")?.textContent?.split("・")?.[0]?.trim() || "";
      const isFavorite = heart.classList.contains("is-favorite");

      try {
        if (isFavorite) {
          const response = await apiFetch(`/api/favorites/${encodeURIComponent(cafeCode || "")}`, { method: "DELETE" });
          if (response.ok) {
            setHeartState(heart, false);
          }
        } else {
          const response = await apiFetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cafeCode, cafeName, area })
          });
          if (response.ok) {
            setHeartState(heart, true);
          }
        }
      } catch (_error) {
        // no-op
      }

      if (currentView === "favorites") {
        renderPage(currentPage);
      }
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest(".heart")) {
        return;
      }
      const cafeId = card.dataset.cafeId;
      if (cafeId) {
        window.location.href = `cafe-detail.html?id=${encodeURIComponent(cafeId)}`;
      }
    });
  });

  renderPage(currentPage);
  await fetchSession();
  await fetchFavorites();

  const searchField = document.querySelector(".search-input input");
  const locateButton = document.querySelector(".locate-btn");
  if (searchField instanceof HTMLInputElement && locateButton instanceof HTMLButtonElement) {
    searchField.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        locateButton.click();
      }
    });
  }

  const cafes = [
    {
      name: "Study Cafe Ueno",
      lat: 35.711,
      lng: 139.777,
      rating: 4.8,
      features: "Wi-Fiあり、電源あり、静か、駅近"
    },
    {
      name: "Nomad Coffee Lab",
      lat: 35.7085,
      lng: 139.7745,
      rating: 4.5,
      features: "長時間OK、広い席、PC作業向き"
    },
    {
      name: "Quiet Beans",
      lat: 35.7132,
      lng: 139.7802,
      rating: 4.4,
      features: "静か、勉強向き、レビュー高評価"
    }
  ];

  const mapElement = document.getElementById("map");
  if (!mapElement || typeof L === "undefined") {
    return;
  }

  const map = L.map("map").setView([35.7118, 139.7773], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  cafes.forEach((cafe) => {
    const popupHtml = `
      <div>
        <div class="map-popup-title">${cafe.name}</div>
        <div class="map-popup-rating">評価: ${cafe.rating}</div>
        <div class="map-popup-features">${cafe.features}</div>
      </div>
    `;

    L.marker([cafe.lat, cafe.lng]).addTo(map).bindPopup(popupHtml);
  });
});
