// static/script.js
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

function createOptionButtons(td, name, week) {
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
}

function addAmbassadorRow(name) {
  const weeks = Array.from(document.querySelectorAll(".week-header"), th => th.dataset.week);
  const tbody = document.querySelector("#tracker-table tbody");
  const tr = document.createElement("tr");
  const tdName = document.createElement("td");
  tdName.innerHTML = `<span class="ambassador-name">${name}</span> <button class="edit-btn">✏️</button> <button class="delete-btn">🗑️</button>`;
  tdName.querySelector(".edit-btn").onclick = () => editAmbassador(tdName);
  tdName.querySelector(".delete-btn").onclick = () => deleteAmbassador(tr);
  tr.appendChild(tdName);

  weeks.forEach(week => {
    const td = document.createElement("td");
    createOptionButtons(td, name, week);
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

function editAmbassador(td) {
  const span = td.querySelector(".ambassador-name");
  const oldName = span.textContent;
  const newName = prompt("Edit ambassador name:", oldName);
  if (!newName || newName === oldName) return;

  document.querySelectorAll(`[data-ambassador="${oldName}"]`).forEach(el => {
    el.dataset.ambassador = newName;
  });
  span.textContent = newName;
}

function deleteAmbassador(tr) {
  if (confirm("Delete this ambassador?")) tr.remove();
}

function addWeekColumn(weekName) {
  const theadRow = document.querySelector("#tracker-table thead tr");
  const th = document.createElement("th");
  th.className = "week-header";
  th.dataset.week = weekName;
  th.innerHTML = `${weekName} <button class="edit-week">✏️</button> <button class="delete-week">🗑️</button>`;
  th.querySelector(".edit-week").onclick = () => editWeek(th);
  th.querySelector(".delete-week").onclick = () => deleteWeek(th);
  theadRow.appendChild(th);

  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const name = row.firstChild.querySelector(".ambassador-name").textContent;
    const td = document.createElement("td");
    createOptionButtons(td, name, weekName);
    row.appendChild(td);
  });
}

function editWeek(th) {
  const oldName = th.dataset.week;
  const newName = prompt("Edit week name:", oldName);
  if (!newName || newName === oldName) return;

  th.dataset.week = newName;
  th.childNodes[0].nodeValue = newName + " ";

  document.querySelectorAll(`[data-week="${oldName}"]`).forEach(el => {
    el.dataset.week = newName;
  });
}

function deleteWeek(th) {
  const index = Array.from(th.parentNode.children).indexOf(th);
  if (confirm("Delete this week column?")) {
    th.remove();
    document.querySelectorAll(`#tracker-table tbody tr`).forEach(row => {
      row.children[index].remove();
    });
  }
}

document.getElementById("add-ambassador-btn").addEventListener("click", () => {
  const name = document.getElementById("new-ambassador").value.trim();
  if (name) {
    addAmbassadorRow(name);
    document.getElementById("new-ambassador").value = "";
  }
});

document.getElementById("add-week-btn").addEventListener("click", () => {
  const weekName = prompt("Enter week name (e.g., Week 3):");
  if (weekName) {
    addWeekColumn(weekName);
  }
});

document.getElementById("save-btn").addEventListener("click", () => {
  fetch("/save", { method: "POST" }).then(res => {
    if (res.ok) alert("Saved successfully!");
  });
});

document.getElementById("ambassador-filter").addEventListener("input", function () {
  const value = this.value.toLowerCase();
  document.querySelectorAll("#tracker-table tbody tr").forEach(row => {
    const name = row.querySelector(".ambassador-name").textContent.toLowerCase();
    row.style.display = name.includes(value) ? "" : "none";
  });
});