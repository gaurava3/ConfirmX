// TRAIN SEARCH + PREDICTION ENGINE

async function fetchTrains() {
  const source = document.getElementById("source").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const date = document.getElementById("date").value;
  const trainNumber = document.getElementById("trainNumber").value.trim();

  if (!source || !destination || !date) {
    alert("Please fill Source, Destination & Date");
    return;
  }

  const resultBox = document.getElementById("trainResult");
  resultBox.innerHTML = "Loading trains...";

  try {
    const response = await fetch(`https://irctc-api2.p.rapidapi.com/trainAvailability?source=${source}&destination=${destination}&date=${date}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    const data = await response.json();
    console.log("Train API Data:", data);

    let trains = data.data;

    // FILTER TRAIN NUMBER (optional feature)
    if (trainNumber) {
      trains = trains.filter(t => t.trainNumber === trainNumber);
    }

    if (!trains.length) {
      resultBox.innerHTML = "No trains found.";
      return;
    }

    let html = "";

    trains.forEach(train => {
      html += `
        <div class="card">
          <h3>${train.trainName} (${train.trainNumber})</h3>
          <p><b>${train.from.code}</b> → <b>${train.to.code}</b></p>
          <p>Departure: ${train.departure} | Arrival: ${train.arrival}</p>
          <p>Duration: ${train.duration}</p>
      `;

      train.classAvailability.forEach(cls => {
        let probability = calculateTrainProbability(cls, date);

        html += `
          <div class="class-box">
            <p><b>${cls.class}</b> - ${cls.displayStatus}</p>
            <p>Fare: ₹${cls.fare}</p>
            <p>Chance: ${probability}%</p>
          </div>
        `;
      });

      html += `</div>`;
    });

    resultBox.innerHTML = html;

  } catch (error) {
    console.error(error);
    resultBox.innerHTML = "Error fetching trains.";
  }
}


// 🔥 YOUR CUSTOM ADVANCED FORMULA
function calculateTrainProbability(cls, journeyDate) {

  let prob = 50;

  const status = cls.availability;

  // ✅ Waiting factor
  if (status.includes("WL")) {
    let wl = parseInt(status.split("WL")[1]) || 0;
    prob -= wl * 1.5;
  }

  // ✅ Available seats boost
  if (status.includes("AVL") || status.includes("AVAILABLE")) {
    prob = 100;
  }

  // ✅ RAC boost
  if (status.includes("RAC")) {
    prob += 30;
  }

  // ✅ Quota factor
  if (cls.quota === "GN") prob += 5;
  if (cls.quota === "PQ") prob -= 5;

  // ✅ Days left factor
  const today = new Date();
  const journey = new Date(journeyDate);
  const diffDays = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

  if (diffDays > 15) prob += 15;
  else if (diffDays > 5) prob += 5;
  else prob -= 10;

  // ✅ Clamp
  if (prob > 100) prob = 100;
  if (prob < 0) prob = 0;

  return Math.round(prob);
}
