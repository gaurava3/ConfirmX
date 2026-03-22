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
    let p = d.passengers?.[0];

    if (!p) {
      showError("Passenger data not found");
      return;
    }

    // ======================
    // 🎯 STATUS CHECK
    // ======================
    let status = p.currentStatus || "";

    if (status.includes("CNF") || (p.berth && p.berth !== "")) {
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
      // 🎯 WL LOGIC
      // ======================
      let wl = 0;

      if (status.includes("WL")) {
        wl = parseInt(status.replace(/\D/g, "")) || 0;
      }

      let maxWL = 200;
      let base = (maxWL - wl) / maxWL;

      if (wl <= 10) base += 0.15;
      else if (wl <= 30) base += 0.05;
      else if (wl > 100) base *= 0.6;

      let probability = Math.max(0, Math.min(100, base * 100));

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
    // 👤 PASSENGER INFO
    // ======================
    document.getElementById("passengerInfo").innerHTML = `
      <h3>👤 Passenger</h3>
      <p>Booking: ${p.bookingStatus || "-"}</p>
      <p>Current: ${p.currentStatus || "-"}</p>
      <p>Coach: ${p.coach || "-"}</p>
      <p>Berth: ${p.berth || "-"}</p>
    `;

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
