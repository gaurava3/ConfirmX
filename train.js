// Wait for DOM
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("trainBtn").addEventListener("click", fetchTrains);
});

async function fetchTrains() {

  const source = document.getElementById("source").value.trim().toUpperCase();
  const destination = document.getElementById("destination").value.trim().toUpperCase();
  const dateInput = document.getElementById("date").value;
  const trainNumber = document.getElementById("trainNumber").value.trim();

  const resultBox = document.getElementById("trainResult");

  if (!source || !destination || !dateInput) {
    alert("Fill all fields");
    return;
  }

  // ✅ DATE FIX
  const [year, month, day] = dateInput.split("-");
  const formattedDate = `${day}-${month}-${year}`;

  resultBox.innerHTML = "Loading...";

  try {
    // ✅ YOUR ORIGINAL API (UNCHANGED)
    const res = await fetch(`https://irctc-api2.p.rapidapi.com/trainAvailability?source=${source}&destination=${destination}&date=${formattedDate}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    const data = await res.json();
    console.log("API:", data);

    if (!data.success) {
      resultBox.innerHTML = "Invalid input";
      return;
    }

    let trains = data.data;

    // ✅ FILTER TRAIN NUMBER
    if (trainNumber) {
      trains = trains.filter(t => t.trainNumber === trainNumber);
    }

    if (!trains.length) {
      resultBox.innerHTML = "No trains found";
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

        let probability = calculateTrainProbability(cls, dateInput);

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
    resultBox.innerHTML = "Error fetching data";
  }
}


// ✅ YOUR LOGIC (UNCHANGED BUT SAFE)
function calculateTrainProbability(cls, journeyDate) {
  let prob = 50;

  if (cls.availability.includes("WL")) {
    let match = cls.availability.match(/WL(\d+)/);
    let wl = match ? parseInt(match[1]) : 0;
    prob -= wl * 1.5;
  }

  if (cls.availability.includes("AVL") || cls.availability.includes("AVAILABLE")) {
    return 100;
  }

  if (cls.availability.includes("RAC")) {
    prob += 30;
  }

  const today = new Date();
  const journey = new Date(journeyDate);
  const diff = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

  if (diff > 15) prob += 15;
  else if (diff > 5) prob += 5;
  else prob -= 10;

  return Math.max(0, Math.min(100, Math.round(prob)));
}
