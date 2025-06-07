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
    week: parseInt(button.dataset.week),
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
  const tbody = document.querySelector("#tracker-table tbody");
  const weeks = parseInt(document.getElementById("week-count").value) || 2;
  const tr = document.createElement("tr");
  const tdName = document.createElement("td");
  tdName.textContent = name;
  tr.appendChild(tdName);

  for (let week = 1; week <= weeks; week++) {
    const tdWeek = document.createElement("td");
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
      resetBtn.textContent = "⟳";
      resetBtn.className = "reset-btn";
      resetBtn.addEventListener("click", () => resetCount(btn));
      tdWeek.appendChild(label);
      tdWeek.appendChild(btn);
      tdWeek.appendChild(resetBtn);
      tdWeek.appendChild(document.createElement("br"));
    }
    tr.appendChild(tdWeek);
  }

  tbody.appendChild(tr);
  document.getElementById("new-ambassador").value = "";
});

document.getElementById("save-btn").addEventListener("click", () => {
  fetch("/save", { method: "POST" }).then(res => {
    if (res.ok) alert("Saved successfully!");
  });
});