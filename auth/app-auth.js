const USER_API = "https://script.google.com/macros/s/AKfycbzoovwcdLn6EU_CuqOUak2s9GqSfPUFBKGYfDbp_ZdAmQNzJyJDE2yHzKTSgTULV6Ip/exec";

async function handleCredentialResponse(response) {
  const idToken = response.credential;

  const res = await fetch(USER_API, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ idToken })
  });

  const data = await res.json();

  if (data.result === "forbidden") {
    alert("⚠ 大学アカウントのみ利用できます");
    return;
  }

  if (data.result === "register-required") {
    sessionStorage.setItem("email", data.email);
    window.location.href = "/auth/register.html"; // 修正！
    return;
  }

  if (data.result === "ok") {
    sessionStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/auth/mypage.html"; // 作成予定
  }
}