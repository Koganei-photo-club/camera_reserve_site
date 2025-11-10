document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "ja", // 日本語表示
    height: "auto",
    events: [
      {
        title: "EOS R6 Mark II 貸出中",
        start: "2025-11-12",
        end: "2025-11-15",
        color: "#ffb3b3"
      },
      {
        title: "Nikon D750 貸出中",
        start: "2025-11-20",
        end: "2025-11-23",
        color: "#cce5ff"
      }
    ],
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek"
    },
  });

  calendar.render();
});