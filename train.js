// ================================
// 🌐 GLOBAL FUNCTION (IMPORTANT)
// ================================
window.fetchTrain = async function () {

  console.log("Search clicked ✅");

  const source = document.getElementById("source").value.trim().toUpperCase();
  const destination = document.getElementById("destination").value.trim().toUpperCase();
  const dateInput = document.getElementById("date").value;
  const trainNumber = document.getElementById("trainNumber").value.trim();

  const resultBox = document.getElementById("trainResult");

  if (!source || !destination || !dateInput) {
    alert("Fill all fields");
    return;
  }

  // 📅 FORMAT DATE → DD-MM-YYYY
  const [year, month, day] = dateInput.split("-");
  const formattedDate = `${day}-${month}-${year}`;

  resultBox.innerHTML = "Loading...";

  try {
    const res = await fetch(
      `https://irctc-api2.p.rapidapi.com/trainAvailability?source=${source}&destination=${destination}&date=${formattedDate}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
          "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
        }
      }
    );

    const data = await res.json();
    console.log("API DATA:", data);

    if (!data || !data.success || !Array.isArray(data.data)) {
      resultBox.innerHTML = "Invalid API response";
      return;
    }

    let trains = data.data;

    // 🔍 Optional train filter
    if (trainNumber) {
      trains = trains.filter(t => t.trainNumber === trainNumber);
    }

    if (trains.length === 0) {
      resultBox.innerHTML = "No trains found";
      return;
    }

    let html = "";

    // ================================
    // 🚆 RENDER TRAINS
    // ================================
    trains.forEach(train => {

      html += `
        <div class="card">
          <h3>${train.trainName} (${train.trainNumber})</h3>
          <p><b>${train.from.code}</b> → <b>${train.to.code}</b></p>
          <p>Departure: ${train.departure} | Arrival: ${train.arrival}</p>
          <p>Duration: ${train.duration}</p>
      `;

      if (Array.isArray(train.classAvailability)) {

        train.classAvailability.forEach(cls => {

          let rawStatus = (cls.availability || "").toUpperCase();
          let probability = 0;

          // ================================
          // 🚨 HARD CONDITIONS
          // ================================
          if (
            rawStatus.includes("REGRET") ||
            rawStatus.includes("NOT AVAILABLE") ||
            rawStatus.includes("TRAIN CANCELLED")
          ) {
            probability = 0;
          }

          else if (
            rawStatus.includes("AVAILABLE") ||
            rawStatus.includes("CURR_AVBL")
          ) {
            probability = 100;
          }

          else if (rawStatus.includes("RAC")) {
            probability = 90;
          }

          else {
            // 🔥 WL → USE YOUR ENGINE
            probability = calculatePNRProbability(rawStatus, {
              source: train.from.name,
              destination: train.to.name,
              trainName: train.trainName,
              distance: train.distanceKm,
              runningDays: train.runningDays,
              journeyDate: dateInput,
              journeyClass: cls.class,
              chartPrepared: false
            });
          }

          // ⚡ LAST MOMENT REDUCTION
          const today = new Date();
          const journey = new Date(dateInput);
          const diff = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

          if (diff <= 1 && probability > 0) {
            probability = Math.min(probability, 60);
          }

          html += `
            <div class="class-box">
              <p><b>${cls.class}</b> - ${cls.displayStatus}</p>
              <p>Fare: ₹${cls.fare}</p>
              <p>Chance: ${probability}%</p>
            </div>
          `;
        });

      } else {
        html += `<p>No class data</p>`;
      }

      html += `</div>`;
    });

    resultBox.innerHTML = html;

  } catch (err) {
    console.error("ERROR:", err);
    resultBox.innerHTML = "Error fetching data";
  }
};

// ================================
// 🧠 FINAL PREDICTION ENGINE
// ================================
function calculatePNRProbability(status, data) {

  if (status.includes("CNF")) return 100;
  if (status.includes("RAC")) return 90;

  let wlMatch = status.split("/").pop().match(/WL(\d+)/);
  let wl = wlMatch ? parseInt(wlMatch[1]) : 0;

  let prob = 0;

  // 🔥 WL BASE
  if (wl <= 5) prob = 92;
  else if (wl <= 10) prob = 85;
  else if (wl <= 20) prob = 70;
  else if (wl <= 40) prob = 50;
  else prob = 25;

  // 🎯 QUOTA
  if (status.includes("GNWL")) prob += 5;
  if (status.includes("RLWL")) prob -= 5;
  if (status.includes("PQWL")) prob -= 8;

  // 📅 DAYS
  const today = new Date();
  const journey = new Date(data.journeyDate);
  const diff = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

  if (diff > 15) prob += 5;
  else if (diff > 7) prob += 3;
  else if (diff > 3) prob += 2;
  else prob -= 10;

  // 🌤️ SEASON
  const month = journey.getMonth() + 1;
  if ([10, 11].includes(month)) prob -= 10;
  else if ([4, 5, 6].includes(month)) prob -= 6;
  else if ([1, 2, 7, 8].includes(month)) prob += 3;

  // 🚆 ROUTE DEMAND
  const routeText = (data.source + " " + data.destination).toUpperCase();

  const cities = [
    "DELHI","NDLS","MUMBAI","CSMT","SURAT",
    "PATNA","GORAKHPUR","VARANASI","LUCKNOW"
  ];

  let score = 0;
  cities.forEach(c => {
    if (routeText.includes(c)) score++;
  });

  if (score >= 2) prob -= 8;
  else if (score === 1) prob -= 4;

  // 🚄 TRAIN TYPE
  const name = (data.trainName || "").toUpperCase();

  if (name.includes("RAJDHANI") || name.includes("DURONTO")) prob -= 8;
  if (name.includes("SF") || name.includes("EXP")) prob -= 4;
  if (name.includes("GARIB RATH")) prob -= 6;
  if (name.includes("SPECIAL") || name.includes("SPL")) prob += 3;

  // ⚡ TATKAL
  if (diff <= 2) prob -= 10;

  // 📏 DISTANCE
  if (data.distance < 200) prob -= 8;
  else if (data.distance > 1000) prob += 5;

  // 📆 RUNNING DAYS
  const days = (data.runningDays || "").split(",");
  if (days.length <= 2) prob -= 8;
  else if (days.length >= 6) prob += 3;

  // 🛏️ CLASS
  const cls = (data.journeyClass || "").toUpperCase();
  if (cls.includes("1A")) prob -= 10;
  else if (cls.includes("2A")) prob -= 6;
  else if (cls.includes("3A")) prob -= 3;
  else if (cls.includes("SL")) prob += 5;

  // 🔒 SAFETY
  if (wl <= 10 && prob < 60) prob = 60;
  if (wl <= 5 && prob < 75) prob = 75;

  return Math.max(0, Math.min(100, Math.round(prob)));
}
