// ✅ MAKE FUNCTION GLOBAL (IMPORTANT)
window.fetchPNR = async function () {

  console.log("🔥 PNR Button Clicked");

  const pnr = document.getElementById("pnrInput")?.value.trim();

  const resultBox = document.getElementById("pnrResult");

  if (!pnr) {
    alert("Enter PNR first");
    return;
  }

  resultBox.innerHTML = "Loading...";

  try {

    // ✅ YOUR API (UNCHANGED)
    let res = await fetch(`https://irctc-api2.p.rapidapi.com/pnrStatus?pnr=${pnr}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    let data = await res.json();
    console.log("FULL DATA:", data);

    if (!data || !data.success || !data.data) {
      resultBox.innerHTML = "<p style='color:red;'>Invalid PNR</p>";
      return;
    }

    const d = data.data;

    // ✅ TRAIN INFO
    let html = `
      <div class="card">
        <h3>${d.trainName} (${d.trainNumber})</h3>
        <p><b>${d.source}</b> → <b>${d.destination}</b></p>
        <p>Departure: ${d.departureTime} | Arrival: ${d.arrivalTime}</p>
       <p>Class: ${d?.class ?? "N/A"}</p>
    ` <p> Accurate confirmation chances using smart prediction</p> ;

    // ✅ PASSENGERS LOOP
    let totalProb = 0;
    let count = 0;

    d.passengers.forEach((p, i) => {

      let status = p.currentStatus;
      let prob = calculatePNRProbability(status, d);

      totalProb += prob;
      count++;

      html += `
        <div class="class-box">
          <p><b>Passenger ${i + 1}</b></p>
          <p>Booking: ${p.bookingStatus}</p>
          <p>Current: ${p.currentStatus}</p>
          <p>Coach: ${p.coach || "-"}</p>
          <p>Berth: ${p.berth || "-"}</p>
          <p>Chance: ${prob}%</p>
        </div>
      `;
    });

    // ✅ FINAL PROBABILITY
    let finalProb = Math.round(totalProb / count);

    html += `
      <div class="class-box">
        <h3>Final Prediction: ${finalProb}%</h3>
      </div>
    `;

    html += `</div>`;

    resultBox.innerHTML = html;

  } catch (err) {
    console.error(err);
    resultBox.innerHTML = "<p style='color:red;'>Error fetching PNR</p>";
  }
};


// 🔥 YOUR FORMULA (ADVANCED)
function calculatePNRProbability(status, data) {

  // ================================
  // ✅ DIRECT CASES
  // ================================
  if (status.includes("CNF")) return 100;
  if (status.includes("RAC")) return 90;

  // ================================
  // 🔍 EXTRACT WL (CORRECT WAY)
  // ================================
  let wlMatch = status.split("/").pop().match(/WL(\d+)/);
  let wl = wlMatch ? parseInt(wlMatch[1]) : 0;

  let prob = 0;

  // ================================
  // 🔥 1. WL BASE (MAIN FACTOR)
  // ================================
  if (wl <= 5) prob = 92;
  else if (wl <= 10) prob = 85;
  else if (wl <= 20) prob = 70;
  else if (wl <= 40) prob = 50;
  else prob = 25;

  // ================================
  // ⚖️ 2. QUOTA
  // ================================
  if (status.includes("GNWL")) prob += 5;
  if (status.includes("RLWL")) prob -= 5;
  if (status.includes("PQWL")) prob -= 8;

  // ================================
  // 📅 3. DAYS LEFT
  // ================================
  const today = new Date();
  const journey = new Date(data.journeyDate);
  const diff = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

  if (diff > 15) prob += 5;
  else if (diff > 7) prob += 3;
  else if (diff > 3) prob += 2;
  else prob -= 10;

  // ================================
  // 🌤️ 4. SEASON
  // ================================
  const month = journey.getMonth() + 1;

  if ([10, 11].includes(month)) prob -= 10; // festival
  else if ([4, 5, 6].includes(month)) prob -= 6; // summer
  else if ([1, 2, 7, 8].includes(month)) prob += 3; // low demand

  // ================================
  // 🚆 5. ROUTE DEMAND (SMART)
  // ================================
  const source = (data.source || "").toUpperCase();
  const dest = (data.destination || "").toUpperCase();
  const routeText = source + " " + dest;

  const highDemandCities = [
    "DELHI", "NDLS", "DLI",
    "GORAKHPUR", "GKP",
    "VARANASI", "BSB",
    "PATNA", "PNBE",
    "KOLKATA", "HWH",
    "MUMBAI", "CSMT", "LTT", "BANDRA",
    "SURAT",
    "AHMEDABAD", "ADI",
    "LUCKNOW", "LKO"
  ];

  let demandScore = 0;
  highDemandCities.forEach(city => {
    if (routeText.includes(city)) demandScore++;
  });

  if (demandScore >= 2) prob -= 8;
  else if (demandScore === 1) prob -= 4;

  // ================================
  // 🚄 6. TRAIN POPULARITY
  // ================================
  const trainName = (data.trainName || "").toUpperCase();

  if (
    trainName.includes("RAJDHANI") ||
    trainName.includes("RJDH") ||
    trainName.includes("DURONTO") ||
    trainName.includes("DRNT")
  ) prob -= 8;

  if (
    trainName.includes("SUPERFAST") ||
    trainName.includes("SF") ||
    trainName.includes("EXP") ||
    trainName.includes("EXPRESS")
  ) prob -= 4;

  if (
    trainName.includes("GARIB RATH") ||
    trainName.includes("GR")
  ) prob -= 6;

  if (
    trainName.includes("SPECIAL") ||
    trainName.includes("SPL")
  ) prob += 3;

  // ================================
  // ⚡ 7. TATKAL EFFECT
  // ================================
  if (diff <= 2) prob -= 10;

  // ================================
  // 🧾 8. CHART PREPARED
  // ================================
  if (data.chartPrepared === true) {
    prob -= 15;
  }

  // ================================
  // 📏 9. DISTANCE FACTOR
  // ================================
  const distance = data.distance || 0;

  if (distance < 200) prob -= 8;        // short route → less cancellations
  else if (distance < 500) prob -= 3;
  else if (distance > 1000) prob += 5;  // long route → more cancellations

  // ================================
  // 📆 10. WEEKLY vs DAILY TRAIN
  // ================================
  const runningDays = (data.runningDays || "").toUpperCase();

  const daysCount = runningDays.split(",").length;

  if (daysCount <= 2) prob -= 8;   // weekly
  else if (daysCount <= 4) prob -= 4;
  else prob += 3;                  // daily trains

  // ================================
  // 🛏️ 11. CLASS BASED ADJUSTMENT
  // ================================
  const travelClass = (data.journeyClass || "").toUpperCase();

  if (travelClass.includes("1A")) prob -= 10;
  else if (travelClass.includes("2A")) prob -= 6;
  else if (travelClass.includes("3A")) prob -= 3;
  else if (travelClass.includes("SL")) prob += 5;
  else if (travelClass.includes("2S")) prob += 8;

  // ================================
  // 🔒 12. SAFETY CONTROL
  // ================================
  if (wl <= 10 && prob < 60) prob = 60;
  if (wl <= 5 && prob < 75) prob = 75;

  return Math.max(0, Math.min(100, Math.round(prob)));
}
