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

  // 予約データAPI（必要に応じて書き換え）
  const CAMERA_API = "https://camera-proxy.photo-club-at-koganei.workers.dev/";
  // PC予約APIも後で追加予定

  async function loadReservations(email) {
    let list = document.getElementById("reserve-list");
    list.innerHTML = "読み込み中…";

    try {
        const res = await fetch(CAMERA_API);
        const data = await res.json();
        const rows = data.rows || [];

        const userRes = rows.filter(r => r.name === user.name);

        if (userRes.length === 0) {
            list.innerHTML = "現在アクティブな予約はありません。";
            return;
        }

        // 表示HTML
        list.innerHTML = userRes.map(r => `
        <div class="reserve-item">
            <strong>${r.equip}</strong><br>
            ${r.start} 〜 ${r.end} <br>
            認証コード: ${r.code}
        </div>
      `).join("");

    } catch {
        list.innerHTML = "予約情報を取得できませんでした。";
    }
  }

  // DOMContentLoaded内の最後に追加
  loadReservations(user.email);
});