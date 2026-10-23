/* Potato nutrition calculator and page theme controls. */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const form = document.getElementById('nutrition-form');
  const foodSelect = document.getElementById('potato-type');
  const gramsInput = document.getElementById('potato-grams');
  const errorMessage = document.getElementById('calculator-error');
  const results = document.getElementById('nutrition-results');
  const resultsDescription = document.getElementById('results-description');
  const nutrientRows = document.getElementById('nutrition-values');
  let foods = [];

  // Restore the visitor's last theme choice when the page opens.
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('potato-site-theme') || 'light'; } catch (_) { /* Storage may be disabled. */ }
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');

  themeButton.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  function setTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.textContent = dark ? 'Switch to light mode' : 'Switch to dark mode';
    try { localStorage.setItem('potato-site-theme', theme); } catch (_) { /* Theme still works for this visit. */ }
  }

  // Load the supplied per-100-gram data, then build the preparation menu.
  fetch('potato_nutrition_dataset.json')
    .then((response) => {
      if (!response.ok) throw new Error('The nutrition data file could not be loaded.');
      return response.json();
    })
    .then((dataset) => {
      if (!Array.isArray(dataset.foods) || dataset.foods.length === 0) throw new Error('The nutrition data file has no food entries.');
      foods = dataset.foods;
      foodSelect.replaceChildren();
      foods.forEach((food) => {
        const option = document.createElement('option');
        option.value = food.id;
        option.textContent = food.name;
        foodSelect.append(option);
      });
      const boiled = foods.find((food) => food.id === 'potato_boiled_skin');
      if (boiled) foodSelect.value = boiled.id;
    })
    .catch(() => {
      foodSelect.replaceChildren(new Option('Nutrition data unavailable', ''));
      foodSelect.disabled = true;
      showError('Could not load nutrition data. Open this page through a local web server and check that the JSON file is beside index.html.');
    });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();
    results.hidden = true;

    const grams = Number(gramsInput.value);
    if (gramsInput.value.trim() === '' || !Number.isFinite(grams) || grams < 1 || grams > 10000) {
      showError('Enter a valid amount from 1 to 10,000 grams.');
      gramsInput.focus();
      return;
    }
    const food = foods.find((item) => item.id === foodSelect.value);
    if (!food) {
      showError('Choose a potato preparation after the nutrition data has loaded.');
      foodSelect.focus();
      return;
    }

    // Dataset values are per 100 g, so scale each nutrient by the serving size.
    const scale = grams / 100;
    const units = {
      energy_kcal: ['Calories', 'kcal'], water_g: ['Water', 'g'], carbohydrates_g: ['Carbohydrates', 'g'],
      sugars_g: ['Sugars', 'g'], fiber_g: ['Fiber', 'g'], protein_g: ['Protein', 'g'], fat_g: ['Fat', 'g'],
      vitamin_c_mg: ['Vitamin C', 'mg'], vitamin_b6_mg: ['Vitamin B6', 'mg'], potassium_mg: ['Potassium', 'mg'],
      magnesium_mg: ['Magnesium', 'mg'], phosphorus_mg: ['Phosphorus', 'mg'], iron_mg: ['Iron', 'mg'], sodium_mg: ['Sodium', 'mg']
    };
    nutrientRows.replaceChildren();
    Object.entries(food.nutrients_per_100g).forEach(([key, value]) => {
      const detail = units[key];
      if (!detail || !Number.isFinite(Number(value))) return;
      const row = document.createElement('tr');
      const label = document.createElement('th');
      label.scope = 'row';
      label.textContent = detail[0];
      const amount = document.createElement('td');
      const scaled = Number(value) * scale;
      amount.textContent = `${scaled.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${detail[1]}`;
      row.append(label, amount);
      nutrientRows.append(row);
    });
    resultsDescription.textContent = `For ${grams.toLocaleString()} g of ${food.name.toLowerCase()}. Estimates are scaled from values per 100 g.`;
    results.hidden = false;
  });

  function showError(message) { errorMessage.textContent = message; }
  function clearError() { errorMessage.textContent = ''; }
});
