/*********************************************
 * calendar.js
 * カメラ貸出カレンダー表示用スクリプト
 * Google Sheets（Cloudflare Worker経由）から
 * JSONデータを取得し、FullCalendarに反映する。
 *********************************************/

document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");

  const apiUrl = "https://camera-proxy.photo-club-at-koganei.workers.dev/";

  try {
    const res = await fetch(apiUrl);
    const data = await res.json();

    const events = data.map(row => {
      const endKey = Object.keys(row).find(k => k.includes("返却予定日"));
      const start = row["借り始め予定日を選択してください。"]?.replaceAll("/", "-");
      const end = row[endKey]?.replaceAll("/", "-");

      const lineName = row["LINEの名前を記入してください。"];
      const equipment = row["借りたい機材を選択してください。"];

      return {
        title: `${equipment} 貸出中`,
        start: start,
        end: end,
        color: "#007bff",
        extendedProps: { lineName: lineName } // 👈 ここにLINE名を保存
      };
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "ja",
      height: "auto",
      events: events,
      eventTimeFormat: { hour: "2-digit", minute: "2-digit" },
      displayEventEnd: true,

      // 👇 ホバー時ツールチップ表示
      eventDidMount: function (info) {
        const tooltip = document.createElement("div");
        tooltip.className = "fc-tooltip";
        tooltip.innerText = `LINE名：${info.event.extendedProps.lineName}`;
        document.body.appendChild(tooltip);

        info.el.addEventListener("mouseenter", e => {
          tooltip.style.display = "block";
          tooltip.style.left = e.pageX + 10 + "px";
          tooltip.style.top = e.pageY + 10 + "px";
        });
        info.el.addEventListener("mousemove", e => {
          tooltip.style.left = e.pageX + 10 + "px";
          tooltip.style.top = e.pageY + 10 + "px";
        });
        info.el.addEventListener("mouseleave", () => {
          tooltip.style.display = "none";
        });
      }
    });

    calendar.render();

  } catch (error) {
    console.error("データ取得エラー:", error);
  }
});