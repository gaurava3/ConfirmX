async function fetchPNR() {
  let pnr = document.getElementById("pnr").value.trim();

  if (!pnr) {
    alert("Enter PNR first");
    return;
  }

  document.getElementById("result").innerHTML = "Loading...";
  document.getElementById("message").innerHTML = "";

  try {
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
      showError("Invalid PNR");
      return;
    }

    let d = data.data;
    let passengers = d.passengers;

    if (!passengers || passengers.length === 0) {
      showError("Passenger data not found");
      return;
    }

    let status = passengers[0].currentStatus || "";

    // ======================
    // 🎯 CONFIRMED / RAC CHECK
    // ======================
    if (status.includes("CNF")) {
      document.getElementById("result").innerHTML = "✅ CONFIRMED";
      document.getElementById("message").innerHTML =
        "Your ticket is confirmed.";
    } 
    else if (status.includes("RAC")) {
      document.getElementById("result").innerHTML = "⚠️ RAC";
      document.getElementById("message").innerHTML =
        "High chances of confirmation.";
    } 
    else {
      // ======================
      // 🎯 WL EXTRACTION
      // ======================
      let wl = 0;
      if (status.includes("WL")) {
        wl = parseInt(status.replace(/\D/g, "")) || 0;
      }

      // ======================
      // 🎯 BASE
      // ======================
      let maxWL = 200;
      let base = (maxWL - wl) / maxWL;

      if (wl <= 10) base += 0.15;
      else if (wl <= 30) base += 0.05;
      else if (wl > 100) base *= 0.6;

      base = Math.max(0, Math.min(1, base));

      // ======================
      // 🎯 QUOTA
      // ======================
      let quotaFactor = 1;
      if (status.includes("GNWL")) quotaFactor = 1.2;
      else if (status.includes("PQWL")) quotaFactor = 0.9;
      else if (status.includes("RLWL")) quotaFactor = 0.7;

      // ======================
      // 🎯 CLASS
      // ======================
      let classFactor = 1;
      if (d.class === "SL") classFactor = 1.2;
      else if (d.class === "3A") classFactor = 1.0;
      else if (d.class === "2A") classFactor = 0.85;
      else if (d.class === "1A") classFactor = 0.6;

      // ======================
      // 🎯 TIME (DAYS LEFT)
      // ======================
      let today = new Date();
      let [day, month, year] = d.journeyDate.split("-");
      let journeyDate = new Date(`${year}-${month}-${day}`);

      let diffDays = Math.ceil(
        (journeyDate - today) / (1000 * 60 * 60 * 24)
      );

      let timeFactor = 1;
      if (diffDays > 7) timeFactor = 1.1;
      else if (diffDays >= 4) timeFactor = 1.0;
      else if (diffDays >= 2) timeFactor = 0.8;
      else timeFactor = 1.2;

      // ======================
      // 🎯 SEASON
      // ======================
      let currentMonth = today.getMonth() + 1;
      let seasonFactor = 1;

      if ([4, 5, 6].includes(currentMonth)) seasonFactor = 0.75;
      else if ([10, 11].includes(currentMonth)) seasonFactor = 0.7;

      // ======================
      // 🎯 CAPACITY
      // ======================
      let capacityFactor = 1;
      if (d.class === "SL") capacityFactor = 1.2;
      else if (d.class === "3A") capacityFactor = 1.0;
      else if (d.class === "2A") capacityFactor = 0.85;
      else if (d.class === "1A") capacityFactor = 0.6;

      // ======================
      // 🔥 DEMAND FACTOR (NEW)
      // ======================
      let demandFactor = 1;

      if (wl === 0) demandFactor = 1.1;
      else if (wl <= 20) demandFactor = 1.0;
      else if (wl <= 50) demandFactor = 0.9;
      else demandFactor = 0.75;

      // ======================
      // 🎯 FINAL PROBABILITY
      // ======================
      let probability =
        base *
        quotaFactor *
        classFactor *
        timeFactor *
        seasonFactor *
        capacityFactor *
        demandFactor *
        100;

      probability = Math.max(0, Math.min(100, probability));

      let label = probability >= 80 ? "High Chance ✅"
                : probability >= 50 ? "Medium ⚠️"
                : "Low Chance ❌";

      document.getElementById("result").innerHTML =
        probability.toFixed(2) + "% - " + label;
    }

    // ======================
    // 🚆 TRAIN INFO
    // ======================
    document.getElementById("trainInfo").innerHTML = `
      <h3>🚆 Train Info</h3>
      <p><b>${d.trainName}</b> (${d.trainNumber})</p>
      <p>🚉 ${d.source || "-"} → ${d.destination || "-"}</p>
      <p>Departure: ${d.departureTime || "-"}</p>
      <p>Arrival: ${d.arrivalTime || "-"}</p>
      <p>Duration: ${d.duration || "-"}</p>
      <p>Class: ${d.class || "-"}</p>
    `;

    // ======================
    // 👤 PASSENGER INFO (MULTIPLE)
    // ======================
    let passengerHTML = "<h3>👤 Passenger</h3>";

    if (passengers.length === 1) {
      let p = passengers[0];
      passengerHTML += `
        <p>${p.currentStatus} (${p.coach}-${p.berth})</p>
      `;
    } else {
      let allSameCoach = passengers.every(p => p.coach === passengers[0].coach);

      if (allSameCoach) {
        let coach = passengers[0].coach;
        let berths = passengers.map(p => p.berth).join(" / ");
        let status = passengers[0].currentStatus.split(" ")[0];

        passengerHTML += `<p><b>${status} ${coach}</b> → ${berths}</p>`;
      } else {
        passengers.forEach((p, i) => {
          passengerHTML += `<p>P${i + 1}: ${p.currentStatus} (${p.coach}-${p.berth})</p>`;
        });
      }
    }

    document.getElementById("passengerInfo").innerHTML = passengerHTML;

    // ======================
    // 📊 EXTRA INFO
    // ======================
    document.getElementById("extraInfo").innerHTML = `
      <h3>📊 Extra Info</h3>
      <p>Fare: ₹${d.fare?.ticketFare || "-"}</p>
      <p>Chart Prepared: ${d.chartPrepared ? "Yes" : "No"}</p>
      <p>Train Status: ${d.trainStatus || "-"}</p>
      <p>Cancelled: ${d.isCancelled ? "Yes" : "No"}</p>
      <p>Food Rating: ${d.ratings?.food || "-"}</p>
      <p>Cleanliness: ${d.ratings?.cleanliness || "-"}</p>
      <p>Overall Rating: ${d.ratings?.overall || "-"}</p>
      <p>Pantry: ${d.hasPantry ? "Yes" : "No"}</p>
    `;

  } catch (error) {
    console.error(error);
    showError("Failed to fetch PNR data");
  }
}

// ======================
// ❌ ERROR HANDLER
// ======================
function showError(msg) {
  document.getElementById("result").innerHTML = msg;
  document.getElementById("message").innerHTML = "";
}
