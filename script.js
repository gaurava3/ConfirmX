async function fetchPNR() {
  let pnr = document.getElementById("pnr").value.trim();

  if (!pnr) {
    alert("Enter PNR first");
    return;
  }

  // Show loading
  document.getElementById("result").innerHTML = "Fetching data...";
  document.getElementById("message").innerHTML = "";

  try {
    const response = await fetch(
      `https://irctc-api2.p.rapidapi.com/pnrStatus?pnr=${pnr}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
          "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com",
        },
      }
    );

    const data = await response.json();
    console.log("API Response:", data);

    // ❌ Handle invalid response
    if (!data || !data.success || !data.data) {
      showError("Invalid PNR or API issue");
      return;
    }

    const passenger = data.data.passengers?.[0];

    if (!passenger) {
      showError("Passenger data not found");
      return;
    }

    // =========================
    // 🎯 EXTRACT STATUS
    // =========================
    const status = passenger.currentStatus || "WL 0";

    let wl = 0;

    if (status.includes("WL")) {
      wl = parseInt(status.replace(/\D/g, "")) || 0;
    } else if (status.includes("RAC")) {
      wl = 5; // treat RAC as low WL
    } else if (status.includes("CNF")) {
      wl = 0;
    }

    // =========================
    // 🎯 QUOTA DETECTION
    // =========================
    let quotaFactor = 1;
    let quotaTimeBoost = 1;

    if (status.includes("RLWL")) quotaFactor = 0.45;
    else if (status.includes("PQWL")) quotaFactor = 0.65;
    else quotaFactor = 1.0; // GNWL

    // =========================
    // 🎯 CLASS DETECTION
    // =========================
    const classType = data.data.class || "3A";

    let classFactor = 1;
    if (classType === "SL") classFactor = 1.2;
    else if (classType === "3A") classFactor = 1.0;
    else if (classType === "2A") classFactor = 0.8;
    else if (classType === "1A") classFactor = 0.5;

    // =========================
    // 🎯 DATE HANDLING (FIXED)
    // =========================
    let diffDays = 5;

    try {
      const [day, month, year] = data.data.journeyDate.split("-");
      const journeyDate = new Date(`${year}-${month}-${day}`);
      const today = new Date();

      diffDays = Math.ceil(
        (journeyDate - today) / (1000 * 60 * 60 * 24)
      );
    } catch {
      console.log("Date parsing failed");
    }

    // =========================
    // 🎯 TIME FACTOR
    // =========================
    let timeFactor = 1;

    if (diffDays > 7) timeFactor = 1.2;
    else if (diffDays >= 4) timeFactor = 1.0;
    else if (diffDays >= 2) timeFactor = 0.7;
    else timeFactor = 0.5;

    // =========================
    // 🎯 QUOTA TIME BOOST
    // =========================
    if (status.includes("RLWL")) {
      if (diffDays <= 1) quotaTimeBoost = 1.2;
      else if (diffDays <= 3) quotaTimeBoost = 0.8;
      else quotaTimeBoost = 0.6;
    }

    if (status.includes("PQWL") && diffDays <= 1) {
      quotaTimeBoost = 1.1;
    }

    // =========================
    // 🎯 FESTIVAL DETECTION
    // =========================
    const today = new Date();
    const monthNow = today.getMonth() + 1;

    let festivalFactor = 1;

    // Summer rush
    if ([4, 5, 6].includes(monthNow)) {
      festivalFactor = 0.7;
    }

    // Diwali / festive
    if ([10, 11].includes(monthNow)) {
      festivalFactor = 0.6;
    }

    // =========================
    // 🎯 TRAIN FACTOR
    // =========================
    const trainFactor = 0.8;

    // =========================
    // 🎯 BASE CALCULATION
    // =========================
    const maxWL = 200;

    let base = (maxWL - wl) / maxWL;

    if (wl <= 10) base += 0.15;
    else if (wl <= 30) base += 0.05;
    else if (wl > 100) base *= 0.6;

    base = Math.max(0, Math.min(1, base));

    // =========================
    // 🎯 FINAL PROBABILITY
    // =========================
    let probability =
      base *
      festivalFactor *
      classFactor *
      timeFactor *
      trainFactor *
      quotaFactor *
      quotaTimeBoost *
      100;

    probability = Math.max(0, Math.min(100, probability));

    // =========================
    // 🎯 OUTPUT
    // =========================
    let label = "";
    let message = "";

    if (probability >= 80) {
      label = "High Chance ✅";
      message = "Your ticket is very likely to be confirmed.";
    } else if (probability >= 50) {
      label = "Medium ⚠️";
      message = "Moderate chances of confirmation.";
    } else {
      label = "Low Chance ❌";
      message = "Low probability of confirmation.";
    }

    document.getElementById("result").innerHTML =
      probability.toFixed(2) + "% - " + label;

    document.getElementById("message").innerHTML = message;

  } catch (error) {
    console.error("ERROR:", error);
    showError("Failed to fetch PNR data");
  }
}

// =========================
// ❌ ERROR HANDLER
// =========================
function showError(msg) {
  document.getElementById("result").innerHTML = msg;
  document.getElementById("message").innerHTML = "";
}
