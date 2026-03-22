async function fetchPNR() {
  let pnr = document.getElementById("pnr").value;

  if (!pnr) {
    alert("Enter PNR first");
    return;
  }

  try {
    let response = await fetch(`https://irctc-api2.p.rapidapi.com/pnrStatus?pnr=${pnr}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": "0c6c90110dmsh6de04f6f6414cdcp1dbe9ajsn7ceb30948902",
        "X-RapidAPI-Host": "irctc-api2.p.rapidapi.com"
      }
    });

    let data = await response.json();
    console.log(data);

    let passenger = data.data.passengers[0];
    let status = passenger.current_status;

    // 🎯 WL Extraction
    let wl = 0;
    if (status.includes("WL")) {
      wl = parseInt(status.replace(/\D/g, ""));
    } else if (status.includes("RAC")) {
      wl = 5;
    } else {
      wl = 0;
    }

    // 🎯 Quota Detection
    let quotaFactor = 1;
    let quotaTimeBoost = 1;

    if (status.includes("RLWL")) {
      quotaFactor = 0.45;
    } else if (status.includes("PQWL")) {
      quotaFactor = 0.65;
    }

    // 🎯 Class Detection
    let classType = data.data.journey_class;

    let classFactor = 1;
    if (classType === "SL") classFactor = 1.2;
    else if (classType === "3A") classFactor = 1.0;
    else if (classType === "2A") classFactor = 0.8;
    else if (classType === "1A") classFactor = 0.5;

    // 🎯 Days Left Calculation
    let journeyDate = new Date(data.data.date_of_journey);
    let today = new Date();

    let diffDays = Math.ceil((journeyDate - today) / (1000 * 60 * 60 * 24));

    let timeFactor = 1;
    if (diffDays > 7) timeFactor = 1.2;
    else if (diffDays >= 4) timeFactor = 1.0;
    else if (diffDays >= 2) timeFactor = 0.7;
    else timeFactor = 0.5;

    // 🎯 Quota Time Boost
    if (status.includes("RLWL")) {
      if (diffDays <= 1) quotaTimeBoost = 1.2;
      else if (diffDays <= 3) quotaTimeBoost = 0.8;
      else quotaTimeBoost = 0.6;
    }

    if (status.includes("PQWL") && diffDays <= 1) {
      quotaTimeBoost = 1.1;
    }

    // 🎯 Festival Detection (AUTO 🔥)
    let month = today.getMonth() + 1;

    let festivalFactor = 1;

    if ([4, 5, 6].includes(month)) {
      festivalFactor = 0.7; // Summer rush
    } else if ([10, 11].includes(month)) {
      festivalFactor = 0.6; // Diwali / festive
    }

    // 🎯 Train factor (static for now)
    let trainFactor = 0.8;

    // 🎯 Base Calculation
    let maxWL = 200;
    let base = (maxWL - wl) / maxWL;

    if (wl <= 10) base += 0.15;
    else if (wl <= 30) base += 0.05;
    else if (wl > 100) base *= 0.6;

    // 🎯 Final Probability
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

    // 🎯 Output
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
    console.error(error);
    alert("Failed to fetch PNR data");
  }
}
