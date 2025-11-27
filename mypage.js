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
  const gradeNames = ["","B1","B2","B3","B4","M1","M2"];
  const roleNames  = ["役職なし","部長","副部長","会計","文連"];

  // DOMへ反映
  document.getElementById("mp-name").textContent  = user.name;
  document.getElementById("mp-grade").textContent = gradeNames[user.grade] ?? "ー";
  document.getElementById("mp-line").textContent  = user.lineName;
  document.getElementById("mp-email").textContent = user.email;
  document.getElementById("mp-role").textContent  = roleNames[user.role] ?? "ー";

  // ログアウトボタン
  document.getElementById("logoutBtn").onclick = () => {
    sessionStorage.clear();
    window.location.href = "/reserve_site/auth/login.html";
  };
});