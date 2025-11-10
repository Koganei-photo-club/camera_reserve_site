document.addEventListener("DOMContentLoaded", async function () {
  const calendarEl = document.getElementById("calendar");
  const apiURL = "https://script.google.com/a/macros/stu.hosei.ac.jp/s/AKfycbz8DPPUpn8yVTUil7jbXgCh8rwOzQFXiRhLSU40dtzUM5oHM6lui_aRF0w2wWaTPG1Fww/exec"; // あなたのGAS URL

  try {
    const response = await fetch(apiURL);
    const data = await response.json();

    // 🔹 FullCalendarに渡すデータを加工
    const events = data.map(row => ({
      title: `${row.equipment} 貸出中 ${row.lineName}`,  // 表示形式を変更！
      start: row.start,
      end: row.end,
      color: "#99ccff"
    }));

    // 🔹 カレンダーを描画
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      locale: "ja",
      height: "auto",
      events: events,
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek"
      }
    });

    calendar.render();
  } catch (error) {
    console.error("データ取得エラー:", error);
  }
});