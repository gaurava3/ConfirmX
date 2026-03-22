function calculate() {
  let wl = parseInt(document.getElementById("wl").value);
  let classFactor = parseFloat(document.getElementById("class").value);
  let festival = parseFloat(document.getElementById("festival").value);
  let time = parseFloat(document.getElementById("days").value);
  let quota = document.getElementById("quota").value;

  let maxWL = 200;

  // Base
  let base = (maxWL - wl) / maxWL;

  if (wl >= maxWL) base = 0;
  if (wl <= 0) base = 1;

  // WL Boost
  if (wl <= 10) base += 0.15;
  else if (wl <= 30) base += 0.05;
  else if (wl > 100) base *= 0.6;

  // Train Factor (fixed for now)
  let train = 0.8;

  // Quota Factor
  let quotaFactor = 1;
  let quotaTimeBoost = 1;

  if (quota === "PQWL") {
    quotaFactor = 0.65;
    if (time === 0.5) quotaTimeBoost = 1.1;
  } 
  else if (quota === "RLWL") {
    quotaFactor = 0.45;
    if (time === 0.5) quotaTimeBoost = 1.2;
    else if (time === 0.7) quotaTimeBoost = 0.8;
    else quotaTimeBoost = 0.6;
  }

  // Final Calculation
  let probability = base * festival * classFactor * time * train * quotaFactor * quotaTimeBoost * 100;

  // Clamp
  probability = Math.max(0, Math.min(100, probability));

  // Label
  let label = "";
  if (probability >= 80) label = "High Chance ✅";
  else if (probability >= 50) label = "Medium ⚠️";
  else label = "Low Chance ❌";

  document.getElementById("result").innerHTML =
    probability.toFixed(2) + "% - " + label;

  // OPTIONAL: Save to Firebase later
}
