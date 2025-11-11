/*********************************************
 * calendar.js
 *********************************************/

document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");
  const apiUrl = "https://camera-proxy.photo-club-at-koganei.workers.dev/";

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    console.log("取得データ:", data);

    const events = data.map(row => {
      const startRaw = row["借り始め予定日"];
      const endRaw = row["返却予定日"];
      const equipment = row["借りたい機材"];

      if (!startRaw || !endRaw) return null;

      const endDate = new Date(endRaw);
      endDate.setDate(endDate.getDate() + 1); // ← +1日で全日表示

      return {
        title: `${equipment} 貸出中`,
        start: startRaw,
        end: endDate.toISOString(),
        color: "#007bff",
      };
    }).filter(e => e !== null);

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "ja",
      height: "auto",
      events: events,
      displayEventEnd: true,
    });

    calendar.render();

  } catch (error) {
    console.error("データ取得エラー:", error);
  }
});