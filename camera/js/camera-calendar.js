/**********************************************
 * カメラ貸出カレンダー（プリフィル対応）
 * 法政大学 小金井写真部
 **********************************************/

document.addEventListener("DOMContentLoaded", async function () {

  const calendarEl = document.getElementById("calendar");

  // ====== Google フォーム プリフィル設定 ======
  const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfNVO0OilcqtDFXmj2FjauZ4fQX7_ZKO0xBdZIf6U9Cg53yMQ/viewform?usp=pp_url";

  const FIELD_NAME       = "entry.1157219546";   // 氏名
  const FIELD_LINE       = "entry.6062883";      // LINEの名前
  const FIELD_CAMERA     = "entry.389826105";    // 機材名
  const FIELD_START      = "entry.445112185";    // 借り始め
  const FIELD_END        = "entry.1310995013";   // 返却予定日
  const FIELD_AUTH       = "entry.189182490";     // 認証番号

  // ====== 貸出可能なカメラ一覧 ======
  const CAMERAS = [
    "Canon EOS 5D Mark III",
    "Canon EOS R10",
    "Nikon D3000"
  ];

  // ====== 今日の日付 00:00:00 にリセット ======
  const today = new Date();
  today.setHours(0,0,0,0);

  // ====== カレンダー初期化 ======
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja",
    height: "auto",

    dateClick(info) {
      const dateStr = info.dateStr;

      if (!isBorrowDateAvailable(dateStr)) {
        alert("借り始め日は今日から 7 日以上先の日付のみ選択できます。");
        return;
      }

      openDayModal(dateStr);
    }
  });

  calendar.render();


  /*******************************************
   * 🔶 借り始め可能かを判定（今日＋7日後以降）
   *******************************************/
  function isBorrowDateAvailable(dateStr) {
    const target = new Date(dateStr);
    target.setHours(0,0,0,0);

    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7); // 今日＋7日

    return target >= limit;
  }


  /*******************************************
   * 🔶 日別モーダルの制御
   *******************************************/
  const dayModal = document.getElementById("dayModal");
  const dayTitle = document.getElementById("dayTitle");
  const cameraButtons = document.getElementById("cameraButtons");
  const dayClose = document.getElementById("dayClose");

  dayClose.addEventListener("click", () => {
    dayModal.style.display = "none";
  });


  function openDayModal(dateStr) {
    dayTitle.textContent = `${dateStr} を借り始め日に設定`;

    cameraButtons.innerHTML = "";

    CAMERAS.forEach(camera => {
      const btn = document.createElement("button");
      btn.className = "slot free";
      btn.textContent = camera;

      btn.addEventListener("click", () => {
        openPrefilledForm(dateStr, camera);
      });

      cameraButtons.appendChild(btn);
    });

    dayModal.style.display = "flex";
  }


  /*******************************************
   * 🔶 Google フォームへプリフィル遷移
   *******************************************/
  function openPrefilledForm(startDate, camera) {

    // 返却予定日は 7 日後
    const endDate = calcEndDate(startDate);

    const url =
      `${FORM_URL}`
      + `&${FIELD_NAME}=`       // 氏名（空のまま）
      + `&${FIELD_LINE}=`       // LINE名（空のまま）
      + `&${FIELD_CAMERA}=${encodeURIComponent(camera)}`
      + `&${FIELD_START}=${encodeURIComponent(startDate)}`
      + `&${FIELD_END}=${encodeURIComponent(endDate)}`
      + `&${FIELD_AUTH}=`;      // 認証番号（空のまま）

    window.open(url, "_blank");
  }


  /*******************************************
   * 🔶 返却予定日は借り始めの 7 日後
   *******************************************/
  function calcEndDate(dateStr) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 7);

    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

});