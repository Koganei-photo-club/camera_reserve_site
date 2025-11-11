/*********************************************
 * calendar.js
 * カメラ貸出カレンダー表示用スクリプト
 * Google Sheets（Cloudflare Worker経由）から
 * JSONデータを取得し、FullCalendarに反映する。
 *********************************************/

document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");

  // ✅ Cloudflare Worker の URL
  const apiUrl = "https://camera-proxy.photo-club-at-koganei.workers.dev/";

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    console.log("取得データ:", data); // デバッグ用（あとで削除してOK）

    // ✅ データ整形
    const events = data.map(row => {
      const startRaw = row["借り始め予定日"];
      const endRaw = row["返却予定日"];
      const equipment = row["借りたい機材"];

      // 借り始め・返却日の存在を確認
      if (!startRaw || !endRaw) return null;

      // 返却予定日を含めて表示するため1日加算
      const endDate = new Date(endRaw);
      endDate.setDate(endDate.getDate() + 1);

      return {
        title: `${equipment} 貸出中`,
        start: startRaw,
        end: endDate.toISOString(),
        color: "#007bff",
      };
    }).filter(e => e !== null); // null削除

    // ✅ カレンダー設定
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "ja",
      height: "auto",
      events: events,
      displayEventEnd: true,
      eventTimeFormat: { hour: "2-digit", minute: "2-digit" },
    });

    calendar.render();

  } catch (error) {
    console.error("データ取得エラー:", error);
  }
});