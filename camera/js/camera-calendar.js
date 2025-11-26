/**********************************************
 * 📷 カメラ貸出カレンダー（DB + GAS API 連携）
 **********************************************/

const API_URL =
  "https://script.google.com/macros/s/AKfycbyThexXWqJUzYybFL5VG8EeHfwbYZHXUTjlU5dp1jsx0cTCgZTjwvVxRssljuE20OVeHw/exec";

const apiUrl = "https://camera-proxy.photo-club-at-koganei.workers.dev/";
const CAMERA_DB_URL =
  "https://script.google.com/macros/s/AKfycbyHEx_s2OigM_JCYkanCdf9NQU7mcGGHOUC__OPSBqTuA7TfA-cCrbskM-NrYIwflsT/exec";

function toLocalDate(yyyy_mm_dd) {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

let APPLY_START = null;
let APPLY_END = null;
let APPLY_EQUIP = null;

document.addEventListener("DOMContentLoaded", async function () {
  
  const calendarEl = document.getElementById("calendar");
  const goFormBtn = document.getElementById("goForm");
  const returnSelect = document.getElementById("returnSelect");

  let CAMERA_LIST = [];
  let COLOR_MAP = {};

  try {
    const camRes = await fetch(CAMERA_DB_URL);
    CAMERA_LIST = await camRes.json();
    const colors = ["#007bff", "#28a745", "#ff9800", "#9c27b0", "#3f51b5", "#ff5722"];
    CAMERA_LIST.forEach((cam, i) => COLOR_MAP[cam.name] = colors[i % colors.length]);
  } catch (err) {
    console.error("❌ CAMERA DB error:", err);
  }


  let rawData = [];
  try {
    const res = await fetch(apiUrl);
    rawData = await res.json();
  } catch (err) {
    console.error("❌ Reservations DB error:", err);
  }



  function isCameraBookedAtDate(dateStr, equipName) {
    const t = new Date(dateStr + "T00:00:00");
    return rawData.some(r => {
      if (r.equip !== equipName) return false;
      const s = toLocalDate(r.start);
      const e = toLocalDate(r.end);
      return s <= t && t <= e;
    });
  }

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
    const result = [];
    let cur = new Date(start);

    while (cur <= limit) {
      result.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }


  const events = rawData.map(r => {
    const endPlus1 = new Date(r.end + "T00:00:00");
    endPlus1.setDate(endPlus1.getDate() + 1);
    return {
      title: `${r.equip} 貸出中`,
      start: r.start,
      end: endPlus1.toISOString().slice(0, 10),
      backgroundColor: COLOR_MAP[r.equip] || "#999",
      borderColor: COLOR_MAP[r.equip],
      textColor: "#fff",
      extendedProps: r,
      allDay: true
    };
  });


  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    events,
    dateClick(info) {
      const min = new Date(); min.setDate(min.getDate() + 7);
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
   * 📌 モーダル管理
   ****************************************/

  const showModal = id => {
    const el = document.getElementById(id);
    el.style.display = "flex";
    el.classList.add("show");
  };
  const hideModal = id => {
    const el = document.getElementById(id);
    el.classList.remove("show");
    setTimeout(() => (el.style.display = "none"), 300);
  };


  /****************************************
   * 📌 カメラ選択モーダル
   ****************************************/
  function openDayModal(dateStr) {

    const cameraBtns = document.getElementById("cameraButtons");
    cameraBtns.innerHTML = "";

    CAMERA_LIST.forEach(cam => {
      const btn = document.createElement("button");
      btn.className = "camera-btn";
      btn.textContent = cam.name;
      if (isCameraBookedAtDate(dateStr, cam.name)) {
        btn.textContent += "（貸出中）";
        btn.disabled = true;
      } else {
        btn.onclick = () => openReturnModal(dateStr, cam.name);
      }
      cameraBtns.appendChild(btn);
    });

    showModal("dayModal");
  }

  document.getElementById("dayClose").onclick =
    () => hideModal("dayModal");


  /****************************************
   * 📌 返却日選択モーダル
   ****************************************/
  function openReturnModal(startDate, equip) {

    APPLY_START = startDate;
    APPLY_EQUIP = equip;

    returnSelect.innerHTML = "";
    getAvailableReturnDates(startDate, equip).forEach(d => {
      returnSelect.insertAdjacentHTML("beforeend",
        `<option value="${d}">${d}</option>`);
    });

    hideModal("dayModal");
    showModal("returnModal");
  }

  document.getElementById("closeReturn").onclick =
    () => hideModal("returnModal");


  /****************************************
   * ❌ キャンセル申請
   ****************************************/
  function openCancelModal(equip, start, end) {
    document.getElementById("cancelTarget").textContent = `${equip} / ${start}〜${end}`;
    showModal("cancelModal");
  }

  document.getElementById("cancelClose").onclick =
    () => hideModal("cancelModal");

  document.getElementById("cancelSend").onclick = async () => {
    const payload = {
      mode: "cancel",
      name: cancelName.value.trim(),
      code: cancelCode.value.trim(),
      equip: cancelTarget.textContent.split(" / ")[0],
      start: cancelTarget.textContent.split(" / ")[1].split("〜")[0],
      end: cancelTarget.textContent.split("〜")[1]
    };

    if (!payload.name || !payload.code) {
      cancelMsg.textContent = "❌ 氏名と認証コードを入力してください。";
      return;
    }

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    cancelMsg.textContent = "✔ キャンセル処理完了！";
    setTimeout(() => location.reload(), 600);
  };


  /****************************************
   * 📌 予約申請（UX版）
   ****************************************/
  window.openApplyModal = function(start, end, equip) {

    APPLY_END = end;
    APPLY_EQUIP = equip;

    document.getElementById("applyEquip").textContent = `機材：${equip}`;
    document.getElementById("applyPeriod").textContent = `${start} 〜 ${end}`;

    hideModal("returnModal");
    showModal("applyModal");
  };

  document.getElementById("applyClose").onclick =
    () => hideModal("applyModal");

  document.getElementById("applySend").onclick = async () => {

    const payload = {
      mode: "reserve",
      name: applyName.value.trim(),
      lineName: applyLine.value.trim(),
      equip: APPLY_EQUIP,
      start: APPLY_START,
      end: APPLY_END
    };

    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });

    document.getElementById("applyMsg").textContent = "✔ 予約完了！";
    setTimeout(() => location.reload(), 600);
  };

}); // END DOMContentLoaded