// ======================
// 🔹 SECTION SWITCH
// ======================
function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ======================
// 🔥 COMMON FORMULA FUNCTION (CORE ENGINE)
// ======================
function calculateProbability({ wl, className, quota, journeyDate }) {

  // Base
  let base = (200 - wl) / 200;

  // Demand Factor
  let demandFactor = wl <= 10 ? 1.1 :
                     wl <= 30 ? 1.0 :
                     wl <= 80 ? 0.85 : 0.7;

  // Class Factor
  let classFactor = 1;
  if (className === "SL") classFactor = 1.2;
  else if (className === "3A" || className === "3E") classFactor = 1.0;
  else if (className === "2A") classFactor = 0.85;
  else if (className === "1A") classFactor = 0.6;

  // Quota Factor
  let quotaFactor = 1;
  if (quota.includes("GN")) quotaFactor = 1.2;
  else if (quota.includes("PQ")) quotaFactor = 0.9;
  else if (quota.includes("RL")) quotaFactor = 0.7;

  // Time Factor
  let timeFactor = 1;
  try {
    let today = new Date();
    let journey = new Date(journeyDate);

    let diffDays = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) timeFactor = 1.1;
    else if (diffDays >= 4) timeFactor = 1.0;
    else if (diffDays >= 2) timeFactor = 0.8;
    else timeFactor = 1.2;
  } catch {}

  // Season Factor
  let month = new Date().getMonth() + 1;
  let seasonFactor = 1;

  if ([4,5,6].includes(month)) seasonFactor = 0.75;
  else if ([10,11].includes(month)) seasonFactor = 0.7;

  // Final Probability
  let probability =
    base *
    demandFactor *
    classFactor *
    quotaFactor *
    timeFactor *
    seasonFactor *
    100;

  return Math.max(0, Math.min(100, probability));
}

// ======================
// 🔥 PNR FUNCTION (FULL LOGIC)
// ======================
async function fetchPNR() {

  let pnr = document.getElementById("pnrInput").value.trim();
  if (!pnr) return alert("Enter PNR");

  try {
    let res = await fetch(`https://irctc-api2.p.rapidapi.com/pnrStatus?pnr=${pnr}`, {
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    let data = await res.json();

    if (!data.success) {
      document.getElementById("pnrResult").innerHTML = "Invalid PNR";
      return;
    }

    let d = data.data;
    let passengers = d.passengers;
    let status = passengers[0].currentStatus;

    // CONFIRMED / RAC
    if (status.includes("CNF")) {
      document.getElementById("pnrResult").innerHTML = "<h2>✅ Confirmed</h2>";
    } else if (status.includes("RAC")) {
      document.getElementById("pnrResult").innerHTML = "<h2>⚠️ RAC (High Chance)</h2>";
    } else {

      let wl = parseInt(status.replace(/\D/g, "")) || 0;

      let probability = calculateProbability({
        wl: wl,
        className: d.class,
        quota: status,
        journeyDate: d.journeyDate
      });

      document.getElementById("pnrResult").innerHTML =
        `<h2>${probability.toFixed(0)}% Chance</h2>`;
    }

    // TRAIN INFO
    document.getElementById("trainInfo").innerHTML = `
      <h3>${d.trainName} (${d.trainNumber})</h3>
      <p>${d.source} → ${d.destination}</p>
      <p>Departure: ${d.departureTime}</p>
      <p>Arrival: ${d.arrivalTime}</p>
      <p>Duration: ${d.duration}</p>
      <p>Class: ${d.class}</p>
    `;

    // PASSENGERS
    let phtml = "<h3>Passengers</h3>";
    passengers.forEach((p,i)=>{
      phtml += `<p>P${i+1}: ${p.currentStatus} (${p.coach}-${p.berth})</p>`;
    });
    document.getElementById("passengerInfo").innerHTML = phtml;

    // EXTRA
    document.getElementById("extraInfo").innerHTML = `
      <h3>Extra Info</h3>
      <p>Fare: ₹${d.fare?.ticketFare || "-"}</p>
      <p>Chart Prepared: ${d.chartPrepared ? "Yes" : "No"}</p>
      <p>Food Rating: ${d.ratings?.food || "-"}</p>
    `;

  } catch (error) {
    console.log(error);
    alert("Error fetching PNR");
  }
}

// ======================
// 🚆 TRAIN SEARCH FUNCTION (FULL LOGIC)
// ======================
async function searchTrains() {

  let source = document.getElementById("source").value;
  let destination = document.getElementById("destination").value;
  let date = document.getElementById("date").value;
  let trainNumber = document.getElementById("trainNumber").value.trim();

  if (!source || !destination || !date) {
    alert("Fill all fields");
    return;
  }

  try {
    let res = await fetch(`https://irctc-api2.p.rapidapi.com/trainAvailability?source=${source}&destination=${destination}&date=${date}`, {
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    let data = await res.json();
    let trains = data.data;

    // FILTER TRAIN
    if (trainNumber) {
      trains = trains.filter(t => t.trainNumber === trainNumber);
    }

    let output = "";

    trains.forEach(train => {

      train.classAvailability.forEach(cls => {

        let status = cls.displayStatus;
        let wl = 0;

        if (cls.availability.includes("WL")) {
          wl = parseInt(cls.availability.split("WL")[1]) || 0;
        }

        let probability = calculateProbability({
          wl: wl,
          className: cls.class,
          quota: cls.quota,
          journeyDate: date
        });

        // OVERRIDE CONDITIONS
        if (status.includes("AVL") || status.includes("CURR")) probability = 100;
        if (status.includes("RAC")) probability = 90;
        if (status.includes("REGRET") || status.includes("Cancelled")) probability = 0;

        output += `
          <div class="card">
            <h3>${train.trainName} (${train.trainNumber})</h3>
            <p>${train.from.name} → ${train.to.name}</p>
            <p>Departure: ${train.departure} | Arrival: ${train.arrival}</p>
            <p>Class: ${cls.class}</p>
            <p>Status: ${status}</p>
            <p>Fare: ₹${cls.fare}</p>
            <h3>${probability.toFixed(0)}% Chance</h3>
          </div>
        `;
      });

    });

    document.getElementById("trainResults").innerHTML = output;

  } catch (error) {
    console.log(error);
    alert("Error fetching trains");
  }
}
