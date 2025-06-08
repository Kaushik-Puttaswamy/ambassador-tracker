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
  const name = document.getElementById("new-ambassador").value.trim();
  if (!name) return;

  const weeks = Array.from(document.querySelectorAll(".week-header .week-name")).map(span => span.textContent);
  const tbody = document.querySelector("#tracker-table tbody");
  const tr = document.createElement("tr");
  const tdName = document.createElement("td");
  tdName.innerHTML = `<span class="ambassador-name">${name}</span><span class="edit-icon" onclick="editAmbassadorName(this)">✏️</span><span class="delete-icon" onclick="deleteAmbassadorRow(this)">🗑️</span>`;
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
  document.getElementById("new-ambassador").value = "";
});

document.getElementById("add-week-btn").addEventListener("click", () => {
  const weekName = prompt("Enter week name (e.g., Week 3):");
  if (!weekName) return;

  const theadRow = document.querySelector("#tracker-table thead tr");
  const th = document.createElement("th");
  th.className = "week-header";
  th.innerHTML = `<span class="week-name">${weekName}</span><span class="edit-icon" onclick="editWeekName(this)">✏️</span><span class="delete-icon" onclick="deleteWeekColumn(this)">🗑️</span>`;
  theadRow.appendChild(th);

  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const name = row.querySelector(".ambassador-name").textContent;
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
  fetch("/save", { method: "POST" }).then(res => {
    if (res.ok) alert("Saved successfully!");
  });
});

function editAmbassadorName(icon) {
  const span = icon.parentElement.querySelector(".ambassador-name");
  const newName = prompt("Enter new name:", span.textContent);
  if (newName) {
    const oldName = span.textContent;
    span.textContent = newName;
    const buttons = document.querySelectorAll(`button[data-ambassador="${oldName}"]`);
    buttons.forEach(btn => btn.dataset.ambassador = newName);
  }
}

function deleteAmbassadorRow(icon) {
  const row = icon.closest("tr");
  row.remove();
}

function editWeekName(icon) {
  const span = icon.parentElement.querySelector(".week-name");
  const oldName = span.textContent;
  const newName = prompt("Enter new week name:", oldName);
  if (newName && newName !== oldName) {
    span.textContent = newName;
    const buttons = document.querySelectorAll(`button[data-week="${oldName}"]`);
    buttons.forEach(btn => btn.dataset.week = newName);
  }
}

function deleteWeekColumn(icon) {
  const th = icon.closest("th");
  const index = Array.from(th.parentNode.children).indexOf(th);
  const rows = document.querySelectorAll("#tracker-table tr");
  rows.forEach(row => {
    if (row.children[index]) row.removeChild(row.children[index]);
  });
}

document.getElementById("ambassador-filter").addEventListener("input", (e) => {
  const filter = e.target.value.toLowerCase();
  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const name = row.querySelector(".ambassador-name").textContent.toLowerCase();
    row.style.display = name.includes(filter) ? "" : "none";
  });
});