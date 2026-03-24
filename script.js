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
        <p>Class: ${d.journeyClass}</p>
    `;

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

  let prob = 50;

  // ✅ CONFIRMED
  if (status.includes("CNF")) return 100;

  // ✅ RAC
  if (status.includes("RAC")) prob += 30;

  // ✅ WL LOGIC
  if (status.includes("WL")) {
    let match = status.match(/WL(\d+)/);
    let wl = match ? parseInt(match[1]) : 0;

    prob -= wl * 2;
  }

  // ✅ QUOTA FACTOR
  if (status.includes("GNWL")) prob += 10;
  if (status.includes("PQWL")) prob -= 10;
  if (status.includes("RLWL")) prob -= 5;

  // ✅ DAYS LEFT FACTOR
  const today = new Date();
  const journey = new Date(data.journeyDate);
  const diff = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

  if (diff > 15) prob += 15;
  else if (diff > 7) prob += 8;
  else if (diff > 3) prob += 3;
  else prob -= 10;

  // ✅ SEASON FACTOR (SMART)
  const month = journey.getMonth() + 1;

  // Summer rush
  if ([4, 5, 6].includes(month)) prob -= 10;

  // Festival rush (Oct-Nov)
  if ([10, 11].includes(month)) prob -= 15;

  // Low demand months
  if ([1, 2, 7, 8].includes(month)) prob += 5;

  return Math.max(0, Math.min(100, Math.round(prob)));
}
