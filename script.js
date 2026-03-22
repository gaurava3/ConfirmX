async function fetchPNR() {
  let pnr = document.getElementById("pnr").value;

  if (!pnr) {
    alert("Enter PNR");
    return;
  }

  document.getElementById("result").innerHTML = "Loading...";

  try {
    let res = await fetch(`https://irctc-api2.p.rapidapi.com/pnrStatus?pnr=${pnr}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    let data = await res.json();
    console.log(data);

    if (!data.success) {
      alert("Invalid PNR");
      return;
    }

    let d = data.data;
    let p = d.passengers[0];

    // =======================
    // 🎯 BASIC DATA
    // =======================
    let status = p.currentStatus;
    let wl = status.includes("WL") ? parseInt(status.replace(/\D/g, "")) : 0;

    // =======================
    // 🎯 PROBABILITY LOGIC
    // =======================
    let maxWL = 200;
    let base = (maxWL - wl) / maxWL;

    if (wl <= 10) base += 0.15;
    else if (wl <= 30) base += 0.05;
    else if (wl > 100) base *= 0.6;

    let probability = base * 100;
    probability = Math.max(0, Math.min(100, probability));

    let label = probability >= 80 ? "High Chance ✅"
               : probability >= 50 ? "Medium ⚠️"
               : "Low Chance ❌";

    document.getElementById("result").innerHTML =
      probability.toFixed(2) + "% - " + label;

    // =======================
    // 🚆 TRAIN INFO
    // =======================
    document.getElementById("trainInfo").innerHTML = `
      <h3>🚆 Train Info</h3>
      <p><b>${d.trainName}</b> (${d.trainNumber})</p>
      <p>${d.sourceStation} ➝ ${d.destinationStation}</p>
      <p>Departure: ${d.departureTime}</p>
      <p>Arrival: ${d.arrivalTime}</p>
      <p>Duration: ${d.duration}</p>
      <p>Class: ${d.class}</p>
    `;

    // =======================
    // 👤 PASSENGER INFO
    // =======================
    document.getElementById("passengerInfo").innerHTML = `
      <h3>👤 Passenger</h3>
      <p>Booking: ${p.bookingStatus}</p>
      <p>Current: ${p.currentStatus}</p>
      <p>Coach: ${p.coach || "-"}</p>
      <p>Berth: ${p.berth || "-"}</p>
    `;

    // =======================
    // 📊 EXTRA INFO
    // =======================
    document.getElementById("extraInfo").innerHTML = `
      <h3>📊 Extra Info</h3>
      <p>Fare: ₹${d.ticketFare || "-"}</p>
      <p>Chart Prepared: ${d.chartPrepared ? "Yes" : "No"}</p>
      <p>Train Status: ${d.trainStatus}</p>
      <p>Cancelled: ${d.trainCancelled ? "Yes" : "No"}</p>
      <p>Food Rating: ${d.foodRating || "-"}</p>
      <p>Cleanliness: ${d.cleanlinessRating || "-"}</p>
      <p>Pantry: ${d.hasPantry ? "Yes" : "No"}</p>
    `;

  } catch (err) {
    console.error(err);
    alert("Error fetching data");
  }
}
