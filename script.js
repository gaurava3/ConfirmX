/* GLOBAL */
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #020617);
  color: white;
}

/* NAVBAR */
.navbar {
  padding: 20px;
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 1px;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

/* HERO */
.hero {
  text-align: center;
  padding: 50px 20px;
}

.hero h2 {
  font-size: 32px;
  margin-bottom: 10px;
}

.hero p {
  color: #94a3b8;
}

/* CONTAINER */
.container {
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}

/* GLASS CARD */
.card-glass {
  background: rgba(255,255,255,0.05);
  border-radius: 18px;
  padding: 25px;
  backdrop-filter: blur(18px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.1);
}

/* FORM */
.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.form-row.center {
  justify-content: center;
}

input {
  flex: 1;
  min-width: 150px;
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: rgba(255,255,255,0.08);
  color: white;
  font-size: 14px;
}

input::placeholder {
  color: #94a3b8;
}

/* BUTTON */
button {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  padding: 14px 20px;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: 0.3s;
  font-weight: bold;
}

button:hover {
  transform: scale(1.07);
  box-shadow: 0 0 20px rgba(34,197,94,0.6);
}

/* TRAIN CARD */
.card {
  background: rgba(255,255,255,0.07);
  padding: 20px;
  border-radius: 14px;
  margin-top: 20px;
  transition: 0.3s;
  border: 1px solid rgba(255,255,255,0.08);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.7);
}

/* BEST TRAIN */
.best-train {
  border: 2px solid #22c55e;
  box-shadow: 0 0 20px rgba(34,197,94,0.5);
}

/* CLASS BOX */
.class-box {
  background: rgba(255,255,255,0.1);
  padding: 12px;
  margin-top: 12px;
  border-radius: 10px;
}

/* PROGRESS BAR */
.progress {
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  margin-top: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 10px;
}

/* COLORS */
.green { background: #22c55e; }
.yellow { background: #eab308; }
.red { background: #ef4444; }

/* RESULT SPACING */
#trainResult {
  margin-top: 20px;
}

/* MOBILE */
@media(max-width: 600px) {
  .form-row {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
