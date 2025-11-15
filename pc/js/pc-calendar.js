/********************************************
 *  PC予約カレンダー
 ********************************************/

const WORKER_URL = "https://pc-proxy.photo-club-at-koganei.workers.dev/";

// 予約枠（1日8枠）
const TIME_SLOTS = [
  "10:50〜11:40",
  "11:40〜12:30",
  "13:20〜14:10",
  "14:10〜15:00",
  "15:10〜16:00",
  "16:00〜16:50",
  "17:00〜17:50",
  "17:50〜18:40"
];

document.addEventListener("DOMContentLoaded", async function () {

  /**************************************
   * スプレッドシートから予約状況取得
   **************************************/
  async function fetchMonthlyData() {
    try {
      const res = await fetch(WORKER_URL);
      const json = await res.json();
      return json; // {"2025-11-29": {...}, ...}
    } catch (e) {
      console.error("予約データ取得エラー:", e);
      return {};
    }
  }

  const sheetData = await fetchMonthlyData();


  /*******************************************
   * FullCalendar 初期化
   *******************************************/
  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",

    /**
     * 各日付セルに ◯△× と背景色を表示する
     */
    dayCellDidMount(info) {
      const dateStr = FullCalendar.formatDate(info.date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\//g, "-");

      if (sheetData[dateStr]) {
        const data = sheetData[dateStr];

        // 背景色
        info.el.style.backgroundColor = data.color;
        info.el.style.borderRadius = "8px";

        // マーク（◯△×）
        const mark = document.createElement("div");
        mark.textContent = data.status;
        mark.style.fontSize = "1.3em";
        mark.style.fontWeight = "bold";
        mark.style.textAlign = "center";
        info.el.appendChild(mark);
      }
    },

    /**
     * 日付を押したとき → 日別予約枠 Lightbox を開く
     */
    dateClick(info) {
      const dateStr = FullCalendar.formatDate(info.date, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).replace(/\//g, "-");

      openDayModal(dateStr);
    }
  });

  calendar.render();


  /**************************************
   * 日別 Lightbox UI
   **************************************/
  const dayModal = document.getElementById("dayModal");
  const dayTitle = document.getElementById("dayTitle");
  const timeSlotsDiv = document.getElementById("timeSlots");
  const dayClose = document.getElementById("dayClose");

  dayClose.addEventListener("click", () => {
    dayModal.style.display = "none";
  });


  /**********************************************
   * 日付クリック時：8枠の予約状況を表示
   **********************************************/
  function openDayModal(dateStr) {
    const data = sheetData[dateStr] || { slots: {} };
    dayModal.style.display = "flex";
    dayTitle.textContent = dateStr;

    timeSlotsDiv.innerHTML = "";

    TIME_SLOTS.forEach(slot => {
      const isReserved = data.slots[slot]?.count >= 1;

      const btn = document.createElement("button");
      btn.className = "slot-btn";
      btn.textContent = isReserved ? `${slot}（予約済）` : slot;

      if (isReserved) {
        // 予約済 → キャンセル申請
        btn.classList.add("reserved");
        btn.addEventListener("click", () => openCancelModal(dateStr, slot));
      } else {
        // 空き → 予約申請
        btn.classList.add("free");
        btn.addEventListener("click", () => confirmReserve(dateStr, slot));
      }

      timeSlotsDiv.appendChild(btn);
    });
  }


  /**********************************************
   * 予約申請の確認 → Googleフォームへ
   **********************************************/
  function confirmReserve(dateStr, slot) {
    if (!confirm(`${dateStr}\n${slot}\nこの枠を予約しますか？`)) return;

    // Googleフォームへパラメータ付きで飛ばす
    const url =
      "https://docs.google.com/forms/d/e/1FAIpQLSc_03SmPQFbq-BtfRg-BaWW_DxTkARgwdgMReH_ExbQKx6rtQ/viewform" +
      `?entry.1916762579=${dateStr}` +     // 予約日
      `&entry.780927556=${slot}`;          // 予約枠

    window.open(url, "_blank");
  }


  /**********************************************
   * キャンセル申請モーダル
   **********************************************/
  const cancelModal = document.getElementById("cancelModal");
  const cancelTarget = document.getElementById("cancelTarget");
  const cancelName = document.getElementById("cancelName");
  const cancelCode = document.getElementById("cancelCode");
  const cancelConfirm = document.getElementById("cancelConfirm");
  const cancelClose = document.getElementById("cancelClose");
  const cancelMessage = document.getElementById("cancelMessage");

  cancelClose.addEventListener("click", () => {
    cancelModal.style.display = "none";
    cancelMessage.textContent = "";
  });

  function openCancelModal(dateStr, slot) {
    cancelModal.style.display = "flex";
    cancelTarget.textContent = `予約枠：${dateStr} ${slot}`;
    cancelName.value = "";
    cancelCode.value = "";
    cancelMessage.textContent = "";
  }


  cancelConfirm.addEventListener("click", () => {
    cancelMessage.textContent = "キャンセル申請を送信しました。（※ まだ機能未実装）";
  });

});