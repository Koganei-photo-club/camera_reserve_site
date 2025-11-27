// ======================
// マイページ表示制御
// ======================
document.addEventListener("DOMContentLoaded", () => {
  
  // ユーザー情報の取得
  const userJson = sessionStorage.getItem("user");
  if (!userJson) {
    // 未ログイン → ログインページへリダイレクト
    window.location.href = "/reserve_site/auth/login.html";
    return;
  }

  const user = JSON.parse(userJson);

  // DOMへ反映
  document.getElementById("mp-name").textContent  = user.name;
  document.getElementById("mp-grade").textContent = user.grade;
  document.getElementById("mp-line").textContent  = user.lineName;
  document.getElementById("mp-email").textContent = user.email;
  document.getElementById("mp-role").textContent = ["役職なし","部長","副部長","会計","文連"][user.role] ?? "ー";

  // ログアウトボタン
  document.getElementById("logoutBtn").onclick = () => {
    sessionStorage.clear();
    window.location.href = "/reserve_site/auth/login.html";
  };
});