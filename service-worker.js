/* service-worker.js */
// ===============================
// 📸 法政大学 小金井写真部 予約システム PWA SW（修正版）
// ===============================

// キャッシュ名（更新時はバージョンを上げる）
const CACHE_NAME = "photo-club-cache-v3";

const ASSETS = [
  "/reserve_site/",
  "/reserve_site/index.html",
  "/reserve_site/css/root-style.css",
  "/reserve_site/js/root-script.js",

  // カメラ
  "/reserve_site/camera/index.html",
  "/reserve_site/camera/reserve.html",
  "/reserve_site/camera/css/style.css",
  "/reserve_site/camera/js/camera-calendar.js",

  // PC
  "/reserve_site/pc/index.html",
  "/reserve_site/pc/reserve.html",
  "/reserve_site/pc/css/style.css",
  "/reserve_site/pc/js/pc-calendar.js",

  // アイコン
  "/reserve_site/icons/icon-192.png",
  "/reserve_site/icons/icon-512.png",
  "/reserve_site/icons/icon-180.png"
];

// install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

// fetch（POST や GAS への通信はキャッシュから外す）
self.addEventListener("fetch", (event) => {

  // ★ 1. POST リクエストは無条件で bypass（超重要）
  if (event.request.method !== "GET") {
    return; // ブラウザがそのまま fetch する
  }

  // ★ 2. GAS や API へのアクセスも bypass
  const url = event.request.url;
  if (url.includes("script.google.com") || url.includes("googleusercontent.com")) {
    return; // キャッシュ禁止
  }

  // ★ 3. 通常の GET はキャッシュ優先
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});