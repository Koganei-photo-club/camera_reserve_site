/**********************************************
 * 📷 カメラ貸出カレンダー（DB + GAS API 連携）
 **********************************************/

// ---- 共通 予約/キャンセル API URL ----
const API_URL =
  "https://script.google.com/macros/s/AKfycbyThexXWqJUzYybFL5VG8EeHfwbYZHXUTjlU5dp1jsx0cTCgZTjwvVxRssljuE20OVeHw/exec";

// ---- 予約DB（Cloudflare Worker）----
const apiUrl = "https://camera-proxy.photo-club-at-koganei.workers.dev/";

// ---- カメラDB（GAS Read 用）----
const CAMERA_DB_URL =
  "https://script.google.com/macros/s/AKfycbyHEx_s2OigM_JCYkanCdf9NQU7mcGGHOUC__OPSBqTuA7TfA-cCrbskM-NrYIwflsT/exec";

// ---- 日付処理 ----
function toLocalDate(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// 借り始め・返却日・機材保持
let startDate_global = null;
let equip_global = null;


// ==============================
// DOM 読み込み完了後
// ==============================
document.addEventListener("DOMContentLoaded", async function () {

  const calendarEl = document.getElementById("calendar");
  const goFormBtn = document.getElementById("goForm");
  const returnSelect = document.getElementById("returnSelect");

  /****************************************
   * 📌 カメラ DB 読み込み
   ****************************************/
  let CAMERA_LIST = [];
  let COLOR_MAP = {};
  try {
    const camRes = await fetch(CAMERA_DB_URL);
    CAMERA_LIST = await camRes.json();
    const colors = ["#007bff", "#28a745", "#ff9800", "#9c27b0", "#3f51b5", "#ff5722"];
    CAMERA_LIST.forEach((cam, i) =>
      COLOR_MAP[cam.name] = colors[i % colors.length]
    );
  } catch (err) {
    console.error("❌ カメラ DB 取得失敗", err);
  }

  /****************************************
   * 📌 予約データ取得
   ****************************************/
  let rawData = [];
  try {
    rawData = await (await fetch(apiUrl)).json();
  } catch (err) {
    console.error("❌ 予約 DB 取得失敗:", err);
  }

  /****************************************
   * 📌 特定日が予約済みか？
   ****************************************/
  function isCameraBookedAtDate(dateStr, equipName) {
    const t = new Date(dateStr + "T00:00:00");
    return rawData.some(r => {
      if (r.equip !== equipName) return false;
      const s = toLocalDate(r.start);
      const e = toLocalDate(r.end);
      return s <= t && t <= e;
    });
  }

  /****************************************
   * 📌 返却予定日候補生成
   ****************************************/
  function getAvailableReturnDates(startDate, equip) {
    const start = new Date(startDate + "T00:00:00");
    const maxEnd = new Date(start);
    maxEnd.setDate(start.getDate() + 6);

    let nextStart = null;
    rawData.forEach(r => {
      if (r.equip !== equip) return;
      const s = new Date(r.start + "T00:00:00");
      if (s > start && (!nextStart || s < nextStart)) nextStart = s;
    });

    let limit = nextStart ? new Date(nextStart - 86400000) : maxEnd;
    let result = [];
    let cur = new Date(start);
    while (cur <= limit) {
      result.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }

  /****************************************
   * 📌 カレンダー生成
   ****************************************/
  const events = rawData.map(r => {
    const endPlus1 = new Date(r.end + "T00:00:00");
    endPlus1.setDate(endPlus1.getDate() + 1);
    return {
      title: `${r.equip} 貸出中`,
      start: r.start,
      end: endPlus1.toISOString().slice(0, 10),
      allDay: true,
      backgroundColor: COLOR_MAP[r.equip] || "#999",
      borderColor: COLOR_MAP[r.equip],
      textColor: "#fff",
      extendedProps: r
    };
  });

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    events,
    dateClick(info) {
      const min = new Date();
      min.setDate(min.getDate() + 7);
      if (toLocalDate(info.dateStr) < min) {
        alert("借り始めは今日から7日後以降です");
        return;
      }
      openDayModal(info.dateStr);
    },
    eventClick(info) {
      const r = info.event.extendedProps;
      openCancelModal(r.equip, r.start, r.end);
    }
  });
  calendar.render();

  /****************************************
   * 📌 貸出開始モーダル
   ****************************************/
  const dayModal = document.getElementById("dayModal");
  const dayTitle = document.getElementById("dayTitle");
  const cameraBtns = document.getElementById("cameraButtons");

  function openDayModal(dateStr) {
    dayTitle.textContent = `${dateStr} の貸出可能カメラ`;
    cameraBtns.innerHTML = "";

    CAMERA_LIST.forEach(cam => {
      const btn = document.createElement("button");
      btn.textContent = cam.name;
      btn.className = "camera-btn";
      if (isCameraBookedAtDate(dateStr, cam.name)) {
        btn.textContent += "（貸出中）";
        btn.disabled = true;
      } else {
        btn.onclick = () => openReturnModal(dateStr, cam.name);
      }
      cameraBtns.appendChild(btn);
    });

    dayModal.style.display = "flex";
  }

  document.getElementById("dayClose").onclick =
    () => dayModal.style.display = "none";


  /****************************************
   * 📌 返却予定日選択
   ****************************************/
  const returnModal = document.getElementById("returnModal");

  function openReturnModal(startDate, equip) {
    startDate_global = startDate;
    equip_global = equip;

    returnSelect.innerHTML = "";
    getAvailableReturnDates(startDate, equip).forEach(d => {
      returnSelect.insertAdjacentHTML(
        "beforeend",
        `<option value="${d}">${d}</option>`
      );
    });

    returnModal.style.display = "flex";
    dayModal.style.display = "none";
  }

  document.getElementById("closeReturn").onclick =
    () => returnModal.style.display = "none";


  /****************************************
   * ❌ キャンセル申請
   ****************************************/
  const cancelModal = document.getElementById("cancelModal");
  const cancelTarget = document.getElementById("cancelTarget");
  const cancelName = document.getElementById("cancelName");
  const cancelCode = document.getElementById("cancelCode");
  const cancelMsg = document.getElementById("cancelMessage");

  function openCancelModal(equip, start, end) {
    cancelTarget.textContent = `${equip} / ${start}〜${end}`;
    cancelMsg.textContent = "";
    cancelModal.style.display = "flex";
  }

  document.getElementById("cancelClose").onclick =
    () => cancelModal.style.display = "none";

  document.getElementById("cancelSend").onclick = async () => {
    cancelMsg.textContent = "送信中…";
    const payload = {
      mode: "cancel",
      name: cancelName.value.trim(),
      code: cancelCode.value.trim()
    };

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    cancelMsg.textContent = "✔ キャンセル完了！";
    setTimeout(() => location.reload(), 600);
  };


  /****************************************
   * 📌 予約申請（UX版）
   ****************************************/
  const applyModal = document.getElementById("applyModal");
  const applyEquip = document.getElementById("applyEquip");
  const applyPeriod = document.getElementById("applyPeriod");
  const applyName = document.getElementById("applyName");
  const applyLine = document.getElementById("applyLine");
  const applyMsg = document.getElementById("applyMsg");

  window.openApplyModal = function(start, end, equip) {
    applyEquip.textContent = `機材：${equip}`;
    applyPeriod.textContent = `${start} 〜 ${end}`;
    applyModal.style.display = "flex";
    returnModal.style.display = "none";
  };

  document.getElementById("applySend").onclick = async () => {
    applyMsg.textContent = "送信中…";

    const payload = {
      mode: "reserve",
      name: applyName.value.trim(),
      lineName: applyLine.value.trim(),
      equip: equip_global,
      start: startDate_global,
      end: returnSelect.value
    };

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    applyMsg.textContent = "✔ 予約完了！";
    setTimeout(() => location.reload(), 600);
  };

  document.getElementById("applyClose").onclick =
    () => applyModal.style.display = "none";

});