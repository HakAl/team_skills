document.addEventListener("click", (event) => {
  const button = event.target.closest(".copy-command");
  if (!button) {
    return;
  }
  navigator.clipboard.writeText(button.dataset.clipboard);
});
