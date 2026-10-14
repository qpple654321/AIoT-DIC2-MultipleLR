// Auto-load and auto-train preset datasets so the demo opens with results ready.
// Custom Dataset mode remains manual so users can choose their own target/features first.

const originalLoadCsvText = loadCsvText;

loadCsvText = function (text, name) {
  originalLoadCsvText(text, name);

  const presetMode = els.problem.value !== "custom";
  const dataReady = rows.length > 0 && columns.length >= 2;

  if (presetMode && dataReady) {
    requestAnimationFrame(() => train());
  }
};

els.problem.addEventListener("change", () => {
  const mode = els.problem.value;

  if (mode === "custom") return;

  // app.js resets the UI first; then automatically load the selected preset.
  setTimeout(() => {
    els.url.value = PRESETS[mode].url;
    fetchCsv(PRESETS[mode].url);
  }, 0);
});

// Default landing state: automatically load 50 Startups and train the model.
setTimeout(() => {
  els.url.value = PRESETS.startup.url;
  fetchCsv(PRESETS.startup.url);
}, 0);
