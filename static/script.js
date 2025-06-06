const socket = io();

function updateColor(input) {
  const val = input.value.trim();
  input.className = ""; // reset color

  if (val === "1") input.classList.add("green");
  else if (val === "2") input.classList.add("yellow");
  else if (val === "3") input.classList.add("orange");
  else if (val === "4") input.classList.add("red");

  const data = {
    ambassador: input.dataset.ambassador,
    week: parseInt(input.dataset.week),
    option: parseInt(input.dataset.option),
    count: parseInt(val || "0")
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