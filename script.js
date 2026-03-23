// SECTION SWITCH
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// 🔥 YOUR PREDICTION FORMULA
function calculateProbability(status, daysLeft) {
  let prob = 50;

  // Waiting factor
  if (status.includes("WL")) {
    let num = parseInt(status.replace(/\D/g, ""));
    prob -= num * 2;
  }

  // Days factor
  if (daysLeft > 10) prob += 20;
  else if (daysLeft > 3) prob += 10;
  else prob -= 10;

  // Clamp
  if (prob > 100) prob = 100;
  if (prob < 0) prob = 0;

  return prob;
}

// 🚆 FETCH PNR
async function fetchPNR() {
  const pnr = document.getElementById("pnrInput").value.trim();

  if (!pnr) {
    alert("Enter PNR");
    return;
  }

  const resultBox = document.getElementById("pnrResult");
  resultBox.innerHTML = "Loading...";

  try {
    const res = await fetch(`YOUR_PNR_API_URL/${pnr}`, {
      headers: {
        "X-RapidAPI-Key": "YOUR_KEY",
        "X-RapidAPI-Host": "YOUR_HOST"
      }
    });

    const data = await res.json();

    console.log(data);

    let passengers = data.data.passengers;

    let html = `<div class="card">`;

    passengers.forEach(p => {
      let prob;

      if (p.currentStatus.includes("CNF")) {
        prob = 100;
      } else {
        prob = calculateProbability(p.currentStatus, 5);
      }

      html += `
        <p><b>Passenger ${p.number}</b></p>
        <p>Status: ${p.currentStatus}</p>
        <p>Chance: ${prob}%</p>
        <hr>
      `;
    });

    html += `</div>`;

    resultBox.innerHTML = html;

  } catch (err) {
    console.error(err);
    resultBox.innerHTML = "Error fetching PNR";
  }
}

// 🚆 FETCH TRAINS
async function fetchTrains() {
  const source = document.getElementById("source").value;
  const dest = document.getElementById("destination").value;
  const date = document.getElementById("date").value;
  const trainNo = document.getElementById("trainNumber").value;

  if (!source || !dest || !date) {
    alert("Fill all fields");
    return;
  }

  const resultBox = document.getElementById("trainResult");
  resultBox.innerHTML = "Loading...";

  try {
    const res = await fetch(`YOUR_TRAIN_API_URL?source=${source}&destination=${dest}&date=${date}`, {
      headers: {
        "X-RapidAPI-Key": "YOUR_KEY",
        "X-RapidAPI-Host": "YOUR_HOST"
      }
    });

    const data = await res.json();

    console.log(data);

    let trains = data.data;

    // FILTER TRAIN NUMBER
    if (trainNo) {
      trains = trains.filter(t => t.trainNumber === trainNo);
    }

    let html = "";

    trains.forEach(train => {
      html += `<div class="card">
        <h3>${train.trainName} (${train.trainNumber})</h3>
        <p>${train.from.code} → ${train.to.code}</p>
        <p>Duration: ${train.duration}</p>
      `;

      train.classAvailability.forEach(cls => {
        let prob = cls.predictionPercent || calculateProbability(cls.availability, 5);

        html += `
          <p>${cls.class} → ${cls.displayStatus} (${prob}%)</p>
        `;
      });

      html += `</div>`;
    });

    resultBox.innerHTML = html;

  } catch (err) {
    console.error(err);
    resultBox.innerHTML = "Error fetching trains";
  }
}
