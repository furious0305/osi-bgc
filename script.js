const corsProxy = "https://corsproxy.io/?";
const groupId = 13557370;

const forepage = document.getElementById("forepage");
const scanner = document.getElementById("scanner");
const verifyBtn = document.getElementById("verifyBtn");
const errorMsg = document.getElementById("errorMsg");
const loadingScreen = document.getElementById("loadingScreen");
const scannerInput = document.querySelector("#scanner input");
const resultDiv = document.getElementById("result");

// --- Create logout button once ---
const logoutBtn = document.createElement("button");
logoutBtn.id = "logoutBtn";
logoutBtn.textContent = "Logout";
logoutBtn.className = "logout-btn";
logoutBtn.style.display = "none";
document.body.appendChild(logoutBtn);

// --- Show forepage initially ---
forepage.classList.add("active");

// --- Remember access if verified before ---
const savedVerified = localStorage.getItem("verified");
if (savedVerified === "true") {
  forepage.classList.remove("active");
  scanner.classList.add("active");
  logoutBtn.style.display = "block";
}

// --- Forepage Verification ---
verifyBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  if (!username) return alert("Please enter a username.");

  errorMsg.style.display = "none";
  loadingScreen.classList.add("active");

  try {
    const userRes = await fetch(
      corsProxy + "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: [username] })
      }
    );
    const userData = await userRes.json();
    const userId = userData.data[0]?.id;
    if (!userId) throw new Error("User not found");

    const groupRes = await fetch(
      corsProxy + `https://groups.roblox.com/v2/users/${userId}/groups/roles`
    );
    const groupData = await groupRes.json();
    const inGroup = groupData.data.some((g) => g.group.id === groupId);

    await new Promise((r) => setTimeout(r, 1000));
    loadingScreen.classList.remove("active");

    if (inGroup) {
      localStorage.setItem("verified", "true");
      forepage.classList.remove("active");
      scanner.classList.add("active");
      logoutBtn.style.display = "block";
      if (scannerInput) scannerInput.value = "";
    } else {
      errorMsg.style.display = "block";
    }
  } catch (err) {
    console.error(err);
    loadingScreen.classList.remove("active");
    errorMsg.textContent = "Invalid username or network error.";
    errorMsg.style.display = "block";
  }
});

// --- Logout / Reset ---
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("verified");
  forepage.classList.add("active");
  scanner.classList.remove("active");
  scannerInput.value = "";
  resultDiv.innerHTML = "";
  logoutBtn.style.display = "none";
});

// --- Scanner Functionality ---
document
  .querySelector("#scanner button")
  .addEventListener("click", async () => {
    const username = scannerInput.value.trim();
    resultDiv.innerHTML = "<div class='loading'>🔍 Scanning...</div>";

    if (!username) {
      resultDiv.innerHTML =
        "<div class='error'>❌ Please enter a username.</div>";
      return;
    }

    try {
      // Step 1 — Fetch user ID
      const userRes = await fetch(
        corsProxy + "https://users.roblox.com/v1/usernames/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usernames: [username] })
        }
      );
      const userData = await userRes.json();
      if (!userData.data || !userData.data[0]) {
        resultDiv.innerHTML = "<div class='error'>❌ User not found.</div>";
        return;
      }

      const user = userData.data[0];
      const userId = user.id;

      // Step 2 — Basic info
      const infoRes = await fetch(
        corsProxy + `https://users.roblox.com/v1/users/${userId}`
      );
      const userInfo = await infoRes.json();

      // Step 3 — Group info
      const groupsRes = await fetch(
        corsProxy + `https://groups.roblox.com/v2/users/${userId}/groups/roles`
      );
      const groupsData = await groupsRes.json();
      const groups = groupsData.data || [];
      // --- Main group rank ---
      const mainGroup = groups.find((g) => g.group.id === 3054949);
      let mainGroupRankHTML = "";

      if (mainGroup) {
        mainGroupRankHTML = `
    <div class="embed">
      <div class="embed-title">Main Group Rank</div>
      <div class="embed-line">
        <strong>${mainGroup.group.name}</strong><br>
        → ${mainGroup.role.name}
      </div>
    </div>
  `;
      } else {
        mainGroupRankHTML = `
    <div class="embed">
      <div class="embed-title">Main Group Rank</div>
      <div class="embed-line">User is not in the main group.</div>
    </div>
  `;
      }

      // Step 4 — Divisions/Subdivisions
      const DIVISIONS = {
        3142019: "United States Navy [USA]",
        9981334: "United States Space Force [USAF]",
        4807176: "United States Special Operations Command [USA]",
        15881648: "National Security Agency [USAF]",
        4676186: "United States Army [USAF]",
        10099205: "United States Military Police [USAF]",
        4384609: "United States Air Force 〔USAF〕",
        3979098: "United States Marine Corps [USAF]",
        3652484: "United States Military Education [USA]",
        4449469: "Materiel Command [USA]",
        5677412: "Officers Ascension Course [OAC]",
        5677377: "Department of State [USA]"
      };

      const SUBDIVISIONS = {
        13460330: "[USAF] Space Warfare Command",
        13557370: "[USSF] Special Investigations & Logistical Command",
        11212855: "Space Systems Command [USAF]",
        6807738: "[USAF] Space Training and Readiness Command",
        14957139: "[USSF] Space Development Command",
        13152500: "[USSF] Officer Training School",
        13276769: "[USSF] Space Force Security Command"
      };

      const foundDivisions = groups.filter((g) => DIVISIONS[g.group.id]);
      const foundSubdivs = groups.filter((g) => SUBDIVISIONS[g.group.id]);

      // Step 5 — Account age
      const createdDate = new Date(userInfo.created);
      const ageDays = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const ageYears = (ageDays / 365).toFixed(1);

      // --- HTML for report ---
      const divisionHTML = foundDivisions.length
        ? `<div class="embed"><div class="embed-title">Divisions</div>${foundDivisions
            .map(
              (g) => `
        <div class="division-card"><strong>${
          DIVISIONS[g.group.id]
        }</strong><br>→ ${g.role.name}</div>`
            )
            .join("")}</div>`
        : `<div class="embed"><div class="embed-title">Divisions</div><div class="embed-line">No divisions found.</div></div>`;

      const subdivHTML = foundSubdivs.length
        ? `<div class="embed"><div class="embed-title">Subdivisions</div>${foundSubdivs
            .map(
              (g) => `
        <div class="subdivision-card"><strong>${
          SUBDIVISIONS[g.group.id]
        }</strong><br>→ ${g.role.name}</div>`
            )
            .join("")}</div>`
        : `<div class="embed"><div class="embed-title">Subdivisions</div><div class="embed-line">No subdivisions found.</div></div>`;

      const htmlContent = `
  <div class="embed">
    <div class="embed-title">OSI Background Report</div>
    <div class="embed-line"><strong>Username:</strong> ${user.name}</div>
    <div class="embed-line"><strong>Roblox ID:</strong> ${userId}</div>
    <div class="embed-line"><strong>Account Age:</strong> ${ageDays} days (~${ageYears} years)</div>
    <div class="embed-line"><strong>Description:</strong> ${
      userInfo.description || "No description available."
    }</div>
  </div>
  ${mainGroupRankHTML}
  ${divisionHTML}
  ${subdivHTML}
`;

      // --- Typewriter effect ---
      typeEffect(resultDiv, htmlContent, 8);
    } catch (error) {
      console.error(error);
      resultDiv.innerHTML =
        "<div class='error'>⚠️ An error occurred during the scan.</div>";
    }
  });

// --- Typing animation ---
function typeEffect(container, html, speed) {
  container.innerHTML = "";
  let i = 0;
  function type() {
    if (i < html.length) {
      container.innerHTML =
        html.slice(0, i++) + "<span class='cursor'>|</span>";
      setTimeout(type, speed);
    } else {
      container.innerHTML = html;
    }
  }
  type();
}
