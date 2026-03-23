async function fetchTrains() {
  const source = document.getElementById("source").value.trim().toUpperCase();
  const destination = document.getElementById("destination").value.trim().toUpperCase();
  const dateInput = document.getElementById("date").value;
  const trainNumber = document.getElementById("trainNumber").value.trim();

  if (!source || !destination || !dateInput) {
    alert("Fill all fields");
    return;
  }

  // ✅ FIX DATE FORMAT
  const [year, month, day] = dateInput.split("-");
  const formattedDate = `${day}-${month}-${year}`;

  const resultBox = document.getElementById("trainResult");
  resultBox.innerHTML = "Loading...";

  try {
    const response = await fetch(
      `https://irctc-api2.p.rapidapi.com/trainAvailability?source=${source}&destination=${destination}&date=${formattedDate}`,
      {
        headers: {
          "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
          "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
        }
      }
    );
    
    const resData = await response.json();
    console.log("API:", resData);

    if (!resData.success) {
      resultBox.innerHTML = "Invalid input / No data";
      return;
    }

    let trains = resData.data;

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

      // ✅ LOOP CLASSES
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
    resultBox.innerHTML = "Error fetching trains";
  }
}


// 🔥 YOUR LOGIC (IMPROVED)
function calculateTrainProbability(cls, journeyDate) {
  let prob = 50;
  const status = cls.availability;

  // WL logic
  if (status.includes("WL")) {
    let match = status.match(/WL(\d+)/);
    let wl = match ? parseInt(match[1]) : 0;
    prob -= wl * 1.5;
  }

  // Available
  if (status.includes("AVL") || status.includes("AVAILABLE")) {
    return 100;
  }

  // RAC
  if (status.includes("RAC")) {
    prob += 30;
  }

  // Quota
  if (cls.quota === "GN") prob += 5;
  if (cls.quota === "PQ") prob -= 5;

  // Days factor
  const today = new Date();
  const journey = new Date(journeyDate);
  const diffDays = Math.ceil((journey - today) / (1000 * 60 * 60 * 24));

  if (diffDays > 15) prob += 15;
  else if (diffDays > 5) prob += 5;
  else prob -= 10;

  return Math.max(0, Math.min(100, Math.round(prob)));
}
