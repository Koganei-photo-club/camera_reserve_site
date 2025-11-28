// ======================
// マイページ表示制御
// ======================

document.addEventListener("DOMContentLoaded", () => {

  const userJson = sessionStorage.getItem("user");
  if (!userJson) {
    window.location.href = "/reserve_site/auth/login.html";
    return;
  }

  const user = JSON.parse(userJson);

  // 基本情報表示
  const gradeNames = ["","B1","B2","B3","B4","M1","M2"];
  const roleNames  = ["役職なし","部長","副部長","会計","文連"];

  document.getElementById("mp-name").textContent  = user.name;
  document.getElementById("mp-grade").textContent = gradeNames[user.grade] ?? "ー";
  document.getElementById("mp-line").textContent  = user.lineName;
  document.getElementById("mp-email").textContent = user.email;
  document.getElementById("mp-role").textContent  = roleNames[user.role] ?? "ー";

  // ログアウト
  document.getElementById("logoutBtn").onclick = () => {
    sessionStorage.clear();
    window.location.href = "/reserve_site/auth/login.html";
  };

  loadCameraReservations(user);
  loadPCReservations(user);
});

// ======================
// 🔹 カメラ予約読み込み
// ======================

const CAMERA_API = "https://camera-proxy.photo-club-at-koganei.workers.dev/";

async function loadCameraReservations(user) {
  const container = document.getElementById("camera-reservations");
  container.textContent = "読み込み中...";

  try {
    const res = await fetch(CAMERA_API);
    const data = await res.json();
    const rows = data.rows || [];

    const myRows = rows.filter(r => r.name === user.name);

    if (myRows.length === 0) {
      container.textContent = "予約はありません";
      return;
    }

    myRows.sort((a,b)=> new Date(a.start) - new Date(b.start));

    container.innerHTML = `
      <table class="mypage-table">
        <tr><th>機種</th><th>期間</th><th>認証コード</th></tr>
        ${myRows.map(r=>`
          <tr>
            <td>${r.equip}</td>
            <td>${r.start}〜${r.end}</td>
            <td>${r.code}</td>
          </tr>
        `).join("")}
      </table>
    `;

  } catch {
    container.textContent = "取得エラー";
  }
}

// ======================
// 🔹 PC予約読み込み
// ======================

const PC_API = "https://pc-proxy.photo-club-at-koganei.workers.dev/";

async function loadPCReservations(user) {
  const container = document.getElementById("pc-reservations");
  container.textContent = "読み込み中...";

  try {
    const res = await fetch(PC_API);
    const data = await res.json();
    const rows = data.rows || [];

    const myRows = rows.filter(r => r.name === user.name);

    if (myRows.length === 0) {
      container.textContent = "予約はありません";
      return;
    }

    myRows.sort((a,b)=> new Date(a.start) - new Date(b.start));

    container.innerHTML = `
      <table class="mypage-table">
        <tr><th>枠</th><th>日時</th><th>認証コード</th></tr>
        ${myRows.map(r=>`
          <tr>
            <td>${r.pc}</td>
            <td>${r.start}</td>
            <td>${r.code}</td>
          </tr>
        `).join("")}
      </table>
    `;

  } catch {
    container.textContent = "取得エラー";
  }
}