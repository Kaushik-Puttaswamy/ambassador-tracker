const socket = io();

function getColorClass(count) {
  if (count === 1) return "green";
  if (count === 2) return "yellow";
  if (count === 3) return "orange";
  if (count >= 4) return "red";
  return "";
}

function incrementCount(button) {
  let count = parseInt(button.textContent.trim()) || 0;
  count++;
  button.textContent = count;
  button.className = `opt-btn ${getColorClass(count)}`;
  sendUpdate(button, count);
}

function resetCount(button) {
  button.textContent = "0";
  button.className = "opt-btn";
  sendUpdate(button, 0);
}

function sendUpdate(button, count) {
  const data = {
    ambassador: button.dataset.ambassador,
    week: button.dataset.week,
    option: parseInt(button.dataset.option),
    count: count
  };
  socket.emit("update_click", data);
}

socket.on("broadcast_update", (data) => {
  const selector = `button[data-ambassador="${data.ambassador}"][data-week="${data.week}"][data-option="${data.option}"]`;
  const button = document.querySelector(selector);
  if (button) {
    button.textContent = data.count;
    button.className = `opt-btn ${getColorClass(data.count)}`;
  }
});

document.getElementById("add-ambassador-btn").addEventListener("click", () => {
  const nameInput = document.getElementById("new-ambassador");
  const name = nameInput.value.trim();
  if (!name) return;

  const weeks = Array.from(document.querySelectorAll(".week-header")).map(th => th.textContent.trim());
  const tbody = document.querySelector("#tracker-table tbody");
  const tr = document.createElement("tr");
  const tdName = document.createElement("td");
  tdName.textContent = name;
  tdName.className = "ambassador-name-cell";
  tr.appendChild(tdName);

  weeks.forEach(week => {
    const td = document.createElement("td");
    for (let opt = 1; opt <= 5; opt++) {
      const label = document.createTextNode(`Opt${opt}:`);
      const btn = document.createElement("button");
      btn.textContent = "0";
      btn.className = "opt-btn";
      btn.dataset.ambassador = name;
      btn.dataset.week = week;
      btn.dataset.option = opt;
      btn.addEventListener("click", () => incrementCount(btn));

      const resetBtn = document.createElement("button");
      resetBtn.textContent = "\u27f3";
      resetBtn.className = "reset-btn";
      resetBtn.addEventListener("click", () => resetCount(btn));

      td.appendChild(label);
      td.appendChild(btn);
      td.appendChild(resetBtn);
      td.appendChild(document.createElement("br"));
    }
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
  nameInput.value = "";
});

document.getElementById("add-week-btn").addEventListener("click", () => {
  const weekName = prompt("Enter week name (e.g., Week 3):");
  if (!weekName) return;

  const theadRow = document.querySelector("#tracker-table thead tr");
  const th = document.createElement("th");
  th.className = "week-header";
  th.textContent = weekName;
  theadRow.appendChild(th);

  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const name = row.querySelector(".ambassador-name-cell").textContent.trim();
    const td = document.createElement("td");
    for (let opt = 1; opt <= 5; opt++) {
      const label = document.createTextNode(`Opt${opt}:`);
      const btn = document.createElement("button");
      btn.textContent = "0";
      btn.className = "opt-btn";
      btn.dataset.ambassador = name;
      btn.dataset.week = weekName;
      btn.dataset.option = opt;
      btn.addEventListener("click", () => incrementCount(btn));

      const resetBtn = document.createElement("button");
      resetBtn.textContent = "\u27f3";
      resetBtn.className = "reset-btn";
      resetBtn.addEventListener("click", () => resetCount(btn));

      td.appendChild(label);
      td.appendChild(btn);
      td.appendChild(resetBtn);
      td.appendChild(document.createElement("br"));
    }
    row.appendChild(td);
  });
});

document.getElementById("save-btn").addEventListener("click", () => {
  manualSave();
});

function manualSave() {
  fetch("/save", { method: "POST" }).then(res => {
    if (res.ok) console.log("Saved successfully!");
  });
}

// Auto-save every 5 seconds
setInterval(() => {
  manualSave();
}, 5000);

// Filtering logic
const filterInput = document.getElementById("ambassador-filter");
if (filterInput) {
  filterInput.addEventListener("input", () => {
    const filterValue = filterInput.value.toLowerCase();
    const rows = document.querySelectorAll("#tracker-table tbody tr");
    rows.forEach(row => {
      const nameCell = row.querySelector("td");
      const name = nameCell.textContent.toLowerCase();
      row.style.display = name.includes(filterValue) ? "" : "none";
    });
  });
}