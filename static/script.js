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

socket.on("ambassador_deleted", (data) => {
  const row = document.querySelector(`tr[data-ambassador="${data.ambassador}"]`);
  if (row) row.remove();
});

socket.on("week_deleted", (data) => {
  const headers = document.querySelectorAll(".week-header");
  headers.forEach((th, index) => {
    if (th.textContent === data.week) {
      document.querySelectorAll(`#tracker-table tr`).forEach(row => row.deleteCell(index + 1));
      th.remove();
    }
  });
});

socket.on("ambassador_renamed", ({ old_name, new_name }) => {
  const row = document.querySelector(`tr[data-ambassador="${old_name}"]`);
  if (row) {
    row.dataset.ambassador = new_name;
    row.querySelector("td").textContent = new_name;
    row.querySelectorAll("button").forEach(btn => {
      btn.dataset.ambassador = new_name;
    });
  }
});

socket.on("week_renamed", ({ old_week, new_week }) => {
  const headers = document.querySelectorAll(".week-header");
  headers.forEach(th => {
    if (th.textContent === old_week) th.textContent = new_week;
  });

  document.querySelectorAll(`button[data-week="${old_week}"]`).forEach(btn => {
    btn.dataset.week = new_week;
  });
});

document.getElementById("add-ambassador-btn").addEventListener("click", () => {
  const name = document.getElementById("new-ambassador").value.trim();
  if (!name) return;

  const weeks = Array.from(document.querySelectorAll(".week-header")).map(th => th.textContent);
  const tbody = document.querySelector("#tracker-table tbody");
  const tr = document.createElement("tr");
  tr.setAttribute("data-ambassador", name);
  const tdName = document.createElement("td");
  tdName.textContent = name;
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
  th.textContent = weekName;
  theadRow.appendChild(th);

  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const name = row.querySelector("td").textContent;
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

function deleteAmbassador(name) {
  if (confirm(`Delete ambassador "${name}"?`)) {
    socket.emit("delete_ambassador", { ambassador: name });
  }
}

function deleteWeek(week) {
  if (confirm(`Delete week "${week}"?`)) {
    socket.emit("delete_week", { week });
  }
}

function renameAmbassador(oldName) {
  const newName = prompt("Enter new name for ambassador:", oldName);
  if (newName && newName !== oldName) {
    socket.emit("rename_ambassador", { old_name: oldName, new_name: newName });
  }
}

function renameWeek(oldWeek) {
  const newWeek = prompt("Enter new name for week:", oldWeek);
  if (newWeek && newWeek !== oldWeek) {
    socket.emit("rename_week", { old_week: oldWeek, new_week: newWeek });
  }
}

function applyFilter(input, weekIndex) {
  const filter = input.value.toLowerCase();
  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const cell = row.cells[weekIndex + 1]; // +1 because 0 is name
    const text = cell.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });
}