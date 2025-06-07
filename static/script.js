const socket = io();

function updateColor(input) {
  const val = parseInt(input.value.trim()) || 0;
  input.className = ""; // reset color

  if (val === 1) input.classList.add("green");
  else if (val === 2) input.classList.add("yellow");
  else if (val === 3) input.classList.add("orange");
  else if (val >= 4) input.classList.add("red");

  const data = {
    ambassador: input.dataset.ambassador,
    week: parseInt(input.dataset.week),
    option: parseInt(input.dataset.option),
    count: val
  };
  socket.emit("update_click", data);
}

socket.on("broadcast_update", (data) => {
  const selector = `input[data-ambassador="${data.ambassador}"][data-week="${data.week}"][data-option="${data.option}"]`;
  const input = document.querySelector(selector);
  if (input) {
    input.value = data.count || "";
    updateColor(input);
  }
});

function addAmbassadorRow(name, weekCount = 2) {
  const tbody = document.querySelector("#tracker-table tbody");
  const tr = document.createElement("tr");
  const tdName = document.createElement("td");
  tdName.textContent = name;
  tr.appendChild(tdName);

  for (let week = 1; week <= weekCount; week++) {
    const tdWeek = document.createElement("td");
    for (let opt = 1; opt <= 5; opt++) {
      const label = document.createTextNode(`Opt${opt}:`);
      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("maxlength", "1");
      input.dataset.ambassador = name;
      input.dataset.week = week;
      input.dataset.option = opt;
      input.addEventListener("input", () => updateColor(input));
      tdWeek.appendChild(label);
      tdWeek.appendChild(input);
      tdWeek.appendChild(document.createElement("br"));
    }
    tr.appendChild(tdWeek);
  }

  tbody.appendChild(tr);
}

document.getElementById("add-ambassador-btn").addEventListener("click", () => {
  const input = document.getElementById("new-ambassador");
  const name = input.value.trim();
  if (name) {
    addAmbassadorRow(name);
    input.value = "";
  }
});