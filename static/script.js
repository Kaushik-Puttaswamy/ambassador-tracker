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

function createFilterInputs() {
  const headerRow = document.querySelector("#tracker-table thead tr");
  const filterRow = document.createElement("tr");

  headerRow.querySelectorAll("th").forEach((th, index) => {
    const filterTh = document.createElement("th");
    if (index === 0) {
      filterTh.innerHTML = '<input type="text" placeholder="Filter Ambassadors">';
    } else {
      filterTh.innerHTML = `<input type="text" placeholder="Filter ${th.textContent}">`;
    }
    filterTh.querySelector("input").addEventListener("input", filterTable);
    filterRow.appendChild(filterTh);
  });

  headerRow.parentElement.insertBefore(filterRow, headerRow.nextSibling);
}

function filterTable() {
  const filters = Array.from(document.querySelectorAll("thead tr:nth-child(2) input"))
    .map(input => input.value.toLowerCase());

  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    let visible = true;

    filters.forEach((filter, index) => {
      if (filter && !cells[index]?.textContent.toLowerCase().includes(filter)) {
        visible = false;
      }
    });

    row.style.display = visible ? "" : "none";
  });
}

document.getElementById("add-ambassador-btn").addEventListener("click", () => {
  const name = document.getElementById("new-ambassador").value.trim();
  if (!name) return;

  const weeks = Array.from(document.querySelectorAll(".week-header")).map(th => th.textContent);
  const tbody = document.querySelector("#tracker-table tbody");
  const tr = document.createElement("tr");
  const tdName = document.createElement("td");

  tdName.innerHTML = `<span contenteditable="true" class="editable">${name}</span>
                      <button onclick="deleteAmbassador(this)">🗑</button>`;
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
  applyEditableHandlers();
});

document.getElementById("add-week-btn").addEventListener("click", () => {
  const weekName = prompt("Enter week name (e.g., Week 3):");
  if (!weekName) return;

  const theadRow = document.querySelector("#tracker-table thead tr");
  const th = document.createElement("th");
  th.className = "week-header";
  th.innerHTML = `<span contenteditable="true" class="editable">${weekName}</span>
                  <button onclick="deleteWeek(this)">🗑</button>`;
  theadRow.appendChild(th);

  const rows = document.querySelectorAll("#tracker-table tbody tr");
  rows.forEach(row => {
    const name = row.firstChild.textContent.trim();
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
  applyEditableHandlers();
});

document.getElementById("save-btn").addEventListener("click", () => {
  fetch("/save", { method: "POST" }).then(res => {
    if (res.ok) alert("Saved successfully!");
  });
});

function deleteAmbassador(button) {
  const name = button.parentElement.textContent.trim();
  if (confirm(`Delete ambassador "${name}"?`)) {
    fetch("/delete_ambassador", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    }).then(res => {
      if (res.ok) {
        button.closest("tr").remove();
      }
    });
  }
}

function deleteWeek(button) {
  const headerCell = button.parentElement;
  const index = Array.from(headerCell.parentNode.children).indexOf(headerCell);
  const week = headerCell.textContent.trim();
  if (confirm(`Delete week "${week}"?`)) {
    fetch("/delete_week", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week })
    }).then(res => {
      if (res.ok) {
        document.querySelectorAll(`#tracker-table tr`).forEach(row => {
          if (row.children[index]) row.children[index].remove();
        });
      }
    });
  }
}

function applyEditableHandlers() {
  document.querySelectorAll(".editable").forEach(el => {
    el.addEventListener("blur", () => {
      const oldVal = el.dataset.oldValue || el.textContent.trim();
      const newVal = el.textContent.trim();
      const isHeader = el.closest("th");
      const type = isHeader ? "week" : "ambassador";

      if (oldVal !== newVal) {
        fetch("/rename", {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, old: oldVal, new: newVal })
        }).then(() => {
          el.dataset.oldValue = newVal;
          location.reload();  // Ensures DOM updates all references
        });
      }
    });

    // Save initial value
    el.dataset.oldValue = el.textContent.trim();
  });
}

window.onload = () => {
  createFilterInputs();
  applyEditableHandlers();
};