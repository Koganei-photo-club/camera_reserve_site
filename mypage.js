// ======================
// マイページ表示制御
// ======================
const CAMERA_API = "https://camera-proxy.photo-club-at-koganei.workers.dev/";
const PC_API     = "https://pc-proxy.photo-club-at-koganei.workers.dev/";

const DEBUG_MODE = true;   // ← ログを見たい間は true、本番運用時は false

document.addEventListener("DOMContentLoaded", () => {

  // ----------------------
  // ログインユーザー取得
  // ----------------------
  const userJson = sessionStorage.getItem("user");
  if (!userJson) {
    window.location.href = "/reserve_site/auth/login.html";
    return;
  }
  const user = JSON.parse(userJson);

  const gradeNames = ["","B1","B2","B3","B4","M1","M2"];
  const roleNames  = ["役職なし","部長","副部長","会計","文連"];

  document.getElementById("mp-name").textContent  = user.name;
  document.getElementById("mp-grade").textContent = gradeNames[user.grade] ?? "ー";
  document.getElementById("mp-line").textContent  = user.lineName;
  document.getElementById("mp-email").textContent = user.email;
  document.getElementById("mp-role").textContent  = roleNames[user.role] ?? "ー";

  document.getElementById("logoutBtn").onclick = () => {
    sessionStorage.clear();
    window.location.href = "/reserve_site/auth/login.html";
  };

  // =========================
  // 🔹 カメラ予約一覧の読み込み
  // =========================
  async function loadCameraReservations() {
    const list = document.getElementById("reserve-list");
    list.innerHTML = "読み込み中…";

    try {
      const res  = await fetch(CAMERA_API);
      const data = await res.json();
      const rows = data.rows || [];

      const myRes = rows.filter(r => r.name === user.name);

      if (myRes.length === 0) {
        list.innerHTML = `<div class="reserve-item">カメラの予約はありません</div>`;
        return;
      }

      list.innerHTML = `
        <table class="reserve-table">
          <tr><th>機材</th><th>期間</th><th>認証コード</th><th></th></tr>
          ${myRes.map(r => `
            <tr>
              <td>${r.equip}</td>
              <td>${r.start}〜${r.end}</td>
              <td>${r.code}</td>
              <td>
                <button class="cancel-btn"
                  data-equip="${r.equip}"
                  data-start="${r.start}"
                  data-code="${r.code}">
                  取り消し
                </button>
              </td>
            </tr>
          `).join("")}
        </table>
      `;

      // このリストの中のボタンだけにイベントを付与
      list.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          openMyCancelModal(
            btn.dataset.equip,   // equip
            btn.dataset.start,   // start
            btn.dataset.code     // code
          );
        });
      });

    } catch (err) {
      console.error(err);
      list.innerHTML = "予約情報取得失敗…";
    }
  }

  // =========================
  // 🔹 PC予約一覧の読み込み
  // =========================
  async function loadPCReservations() {
    const list = document.getElementById("pc-reserve-list");
    if (!list) return;

    list.innerHTML = "読み込み中…";

    try {
      const res  = await fetch(PC_API);
      const data = await res.json();
      const rows = data.rows || [];

      // PC 側は email で紐付け
      const myRes = rows.filter(r => r.email === user.email);

      if (myRes.length === 0) {
        list.innerHTML = `<div class="reserve-item">PC の予約はありません</div>`;
        return;
      }

      list.innerHTML = `
        <table class="reserve-table">
          <tr><th>予約日</th><th>枠</th><th>認証コード</th><th></th></tr>
          ${myRes.map(r => `
            <tr>
              <td>${r.date || "?"}</td>
              <td>${r.slot || "?"}</td>
              <td>${r.auth || "?"}</td>
              <td>
                <button class="cancel-btn"
                  data-slot="${r.slot}"
                  data-date="${r.date}"
                  data-code="${r.auth}">
                  取り消し
                </button>
              </td>
            </tr>
          `).join("")}
        </table>
      `;

      // PC リスト内のボタンだけにイベントを付与
      list.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          // PC のときは slot を equip として渡し、date を start 扱いにする
          openMyCancelModal(
            btn.dataset.slot,   // equip (実際は時刻枠)
            btn.dataset.date,   // startOrDate
            btn.dataset.code    // code
          );
        });
      });

    } catch (err) {
      console.error(err);
      list.innerHTML = "予約情報取得失敗…";
    }
  }

  // =========================
  // 🔹 キャンセルモーダルの「閉じる」
  // =========================
  const cancelCloseBtn = document.getElementById("cancelClose");
  if (cancelCloseBtn) {
    cancelCloseBtn.onclick = () => {
      const m = document.getElementById("cancelModal");
      m.classList.remove("show");
      setTimeout(() => m.style.display = "none", 200);
    };
  }

  // =========================
  // 🔥 初回ロード
  // =========================
  loadCameraReservations();
  loadPCReservations();

  // =============================
  // マイページ用キャンセル操作
  // =============================

  // 既存キャンセルモーダルを利用
  function openMyCancelModal(equip, startOrDate, code) {
    const m = document.getElementById("cancelModal");

    document.getElementById("cancelTarget").textContent =
      `${equip} / ${startOrDate}`;
    document.getElementById("cancelMessage").textContent = "";
    document.getElementById("cancelCode").value = "";

    // 表示＋ふわっと
    m.style.display = "flex";
    setTimeout(() => m.classList.add("show"), 10);

    document.getElementById("cancelSend").onclick = () =>
      myCancelSend(equip, startOrDate, code);
  }

  async function myCancelSend(equip, startOrDate, correctCode) {

    const input = document.getElementById("cancelCode").value.trim();
    if (!input) {
      document.getElementById("cancelMessage").textContent = "❌ コードを入力";
      return;
    }
    if (input !== correctCode) {
      document.getElementById("cancelMessage").textContent = "❌ コードが違います";
      return;
    }

    let targetAPI;
    let payload;

    // =========================
    // PC or カメラ の判定
    // （時刻枠「〜」を含むかどうかで判定）
    // =========================
    const isPC = equip.includes("〜");

    if (isPC) {
      // PCキャンセル
      targetAPI = PC_API;
      payload = {
        requestType: "PCキャンセル",
        date: startOrDate,   // 予約日
        slot: equip,        // 枠（10:50〜11:40 など）
        auth: correctCode,
        name: user.name
      };
    } else {
      // カメラキャンセル（既存仕様）
      targetAPI = CAMERA_API;
      payload = {
        mode: "cancel",
        email: user.email,
        equip,
        start: startOrDate,
        code: correctCode
      };
    }

    if (DEBUG_MODE) {
      console.log("🔥Send cancel payload:", payload);
      document.getElementById("cancelMessage").textContent = "⏳通信中…";
    }

    const res = await fetch(targetAPI, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    if (DEBUG_MODE) {
      const result = await res.json().catch(() => null);
      console.log("📥Cancel response:", result);
      document.getElementById("cancelMessage").textContent =
        "✔ 完了（デバッグ中：結果はコンソールへ）";
      return;
    }

    document.getElementById("cancelMessage").textContent = "✔ キャンセル完了！";
    setTimeout(() => location.reload(), 800);
  }

});  // DOMContentLoaded end