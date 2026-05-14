document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.querySelector("#signup-form");
  const loginForm = document.querySelector("#login-form");
  const configuredBase = window.CAFE_NAVI_API_BASE || "";
  const API_BASE = configuredBase.replace(/\/+$/, "");
  const apiUrl = (path) => `${API_BASE}${path}`;

  const setToken = (token) => {
    if (token) {
      localStorage.setItem("cafeNaviSessionToken", token);
    }
  };

  const parseJsonSafely = async (response) => {
    try {
      return await response.json();
    } catch (_error) {
      return {};
    }
  };

  const showMessage = (target, message, isError = false) => {
    if (!target) {
      return;
    }
    target.textContent = message;
    target.style.color = isError ? "#c62828" : "#2e7d32";
  };

  if (signupForm instanceof HTMLFormElement) {
    const messageEl = document.querySelector("#signup-message");
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const userName = signupForm.querySelector("input[name='userName']")?.value?.trim() || "";
      const email = signupForm.querySelector("input[name='email']")?.value?.trim() || "";
      const password = signupForm.querySelector("input[name='password']")?.value || "";

      try {
        const response = await fetch(apiUrl("/api/signup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userName, email, password })
        });
        const data = await parseJsonSafely(response);
        if (!response.ok) {
          showMessage(messageEl, data.error || `登録に失敗しました (HTTP ${response.status})`, true);
          return;
        }
        showMessage(messageEl, "登録完了。ログイン画面へ移動します。");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 800);
      } catch (_error) {
        showMessage(messageEl, "通信エラー: server.py を起動して http://localhost:8000 で開いてください", true);
      }
    });
  }

  if (loginForm instanceof HTMLFormElement) {
    const messageEl = document.querySelector("#login-message");
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = loginForm.querySelector("input[name='email']")?.value?.trim() || "";
      const password = loginForm.querySelector("input[name='password']")?.value || "";

      try {
        const response = await fetch(apiUrl("/api/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await parseJsonSafely(response);
        if (!response.ok) {
          showMessage(messageEl, data.error || `ログインに失敗しました (HTTP ${response.status})`, true);
          return;
        }
        setToken(data.sessionToken || "");
        showMessage(messageEl, "ログイン成功。トップへ移動します。");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 500);
      } catch (_error) {
        showMessage(messageEl, "通信エラー: server.py を起動して http://localhost:8000 で開いてください", true);
      }
    });
  }
});
