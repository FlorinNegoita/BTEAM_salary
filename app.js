// =======================
// CONFIG
// =======================

const hoursPerDay = 8;
const startDayNumber = dayNumber(2026, 0, 6);
let current = new Date();

const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
const overtimeText = document.getElementById("overtimeText");
const footer = document.getElementById("todayFooter");

const brutInput = document.getElementById("brutInput");
const ticketDisplay = document.getElementById("ticketDisplay");
const salaryDisplay = document.getElementById("salaryDisplay");

// Sporuri
const weekendPercent = 0.10;
const nightPercent = 0.25;
const suplPercent = 2;
const ticketValue = 40;

brutInput.addEventListener("input", render);

// =======================
// HELPERS
// =======================

function round2(n) {
  return Math.round(n * 100) / 100;
}

function dayNumber(y, m, d) {
  return Math.floor(Date.UTC(y, m, d) / 86400000);
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

// =======================
// CONCEDIU
// =======================

const vacationDays = new Set([
  "2026-01-01","2026-01-02","2026-01-03","2026-01-04","2026-01-05","2026-01-06","2026-01-07",
  "2026-04-10","2026-04-11","2026-04-12","2026-04-13",
  "2026-08-08","2026-08-09","2026-08-10","2026-08-11",
  "2026-08-12","2026-08-13","2026-08-14","2026-08-15",
  "2026-08-16","2026-08-17","2026-08-18","2026-08-19",
  "2026-08-20","2026-08-21","2026-08-22","2026-08-23"
]);

// =======================
// SARBATORI
// =======================

const holidays = new Set([
  "2026-01-01","2026-01-02","2026-01-06","2026-01-07","2026-01-24",
  "2026-04-10","2026-04-11","2026-04-12","2026-04-13",
  "2026-05-01","2026-05-31","2026-06-01",
  "2026-08-15",
  "2026-11-30","2026-12-01",
  "2026-12-25","2026-12-26"
]);

// =======================
// SHIFT
// =======================

const cycle = ["sc1","sc1","sc2","sc2","sc3","sc3","lib","lib"];

function shiftFor(date) {
  const dn = dayNumber(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = dn - startDayNumber;
  return cycle[(diff % 8 + 8) % 8];
}

// =======================
// RENDER
// =======================

function render() {

  calendar.innerHTML = "";

  const brutSalary = parseFloat(brutInput.value) || 0;

  const y = current.getFullYear();
  const m = current.getMonth();

  monthTitle.textContent =
    current.toLocaleDateString("ro-RO", {
      month: "long",
      year: "numeric"
    }).toUpperCase();

  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const totalCells = Math.ceil((start + daysInMonth) / 7) * 7;

  let worked = 0;
  let workdays = 0;
  let vacationDaysInMonth = 0;
  let weekendDaysWorked = 0;
  let nightDaysWorked = 0;

  for (let i = 0; i < totalCells; i++) {

    const d = new Date(y, m, i - start + 1);
    const div = document.createElement("div");
    div.className = "day";

    if (d.getMonth() !== m) {
      div.classList.add("other");
      div.innerHTML = `<div>${d.getDate()}</div><div></div>`;
    } else {

      const key = dateKey(d);
      const shift = shiftFor(d);

      const isVacation = vacationDays.has(key);
      const isHoliday = holidays.has(key);
      const isWeekday = d.getDay() > 0 && d.getDay() < 6;

      div.classList.add(shift);
      if (isHoliday) div.classList.add("holiday");
      if (isVacation) div.classList.add("vacation");

      if (!isVacation && shift !== "lib") {

        worked += hoursPerDay;

        if (d.getDay() === 0 || d.getDay() === 6) {
          weekendDaysWorked++;
        }

        if (shift === "sc3") {
          nightDaysWorked++;
        }
      }

      if (isWeekday) {
        workdays++;
        if (isVacation) vacationDaysInMonth++;
      }

      div.innerHTML = `
        <div class="date">${d.getDate()}</div>
        <div class="shift-label">${isVacation ? "CO" : shift.toUpperCase()}</div>
      `;

      const today = new Date();
      if (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      ) {
        div.classList.add("today");
      }
    }

    calendar.appendChild(div);
  }

  // =======================
  // OVERTIME
  // =======================

  const overtime =
    worked - (workdays - vacationDaysInMonth) * hoursPerDay;

  const suplHours = overtime > 0 ? overtime : 0;

  overtimeText.textContent =
    overtime > 0
      ? `${overtime} ore suplimentare`
      : `${overtime} ore`;

  // =======================
  // NORMA LEGALA
  // =======================

  let legalWorkdays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(y, m, day);
    const key = dateKey(d);
    const isWeekday = d.getDay() > 0 && d.getDay() < 6;
    const isHoliday = holidays.has(key);

    if (isWeekday && !isHoliday) {
      legalWorkdays++;
    }
  }

  const normaOre = legalWorkdays * hoursPerDay;

  if (!brutSalary) {
    salaryDisplay.textContent = "—";
    ticketDisplay.textContent = "";
    return;
  }

  // ===== CALCUL CONTABIL =====

  const salariuOrar = round2(brutSalary / normaOre);

  const sporWeekend = round2(
    weekendDaysWorked * hoursPerDay * salariuOrar * weekendPercent
  );

  const nightHoursWithBonus = nightDaysWorked * 7.43;

const sporNoapte = round2(
  nightHoursWithBonus * salariuOrar * nightPercent
);


  const sporSupl = round2(
    suplHours * salariuOrar * suplPercent
  );

  const brutTotal = round2(
    brutSalary + sporWeekend + sporNoapte + sporSupl
  );

  const CAS = round2(brutTotal * 0.25);
  const CASS = round2(brutTotal * 0.10);
  const impozit = round2((brutTotal - CAS - CASS) * 0.10);

  const netSalariu = round2(brutTotal - CAS - CASS - impozit);

  // =======================
  // TICHETE
  // =======================

  let ticketsAuto = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(y, m, day);
    const key = dateKey(d);

    const isWeekday = d.getDay() > 0 && d.getDay() < 6;
    const isVacation = vacationDays.has(key);
    const isHoliday = holidays.has(key);

    if (isWeekday && !isVacation && !isHoliday) {
      ticketsAuto++;
    }
  }

  const netTichete = round2(ticketsAuto * ticketValue * 0.9);
  const totalFinal = round2(netSalariu + netTichete);

  ticketDisplay.textContent = `${ticketsAuto} tichete`;
  salaryDisplay.textContent = `${totalFinal.toFixed(0)} lei`;

  footer.textContent =
    "Azi e: " +
    new Date().toLocaleDateString("ro-RO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
}

// =======================
// NAV
// =======================

document.getElementById("prev").onclick = () => {
  current.setMonth(current.getMonth() - 1);
  render();
};

document.getElementById("next").onclick = () => {
  current.setMonth(current.getMonth() + 1);
  render();
};

document.getElementById("todayBtn").onclick = () => {
  current = new Date();
  render();
};

render();
