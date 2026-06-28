// recipeSharingWebsite/script.js
// This script handles the functionality of the recipe sharing website.
// It includes features for displaying recipes, filtering, adding new recipes, and viewing details.

(function () {
  'use strict';

  /* -------------------- Utilities -------------------- */
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  /* -------------------- Storage helpers -------------------- */
  function loadRecipes() {
    try {
      const saved = JSON.parse(localStorage.getItem('recipes') || 'null');
      // Return copy so original SAMPLE_RECIPES not accidentally mutated
      if (saved && Array.isArray(saved)) return saved;
    } catch (e) {
      console.warn('Could not parse recipes from localStorage', e);
    }
    // Fall back to SAMPLE_RECIPES if present
    if (window.SAMPLE_RECIPES && Array.isArray(window.SAMPLE_RECIPES)) {
      return window.SAMPLE_RECIPES.map(r => Object.assign({}, r));
    }
    return [];
  }

  function saveRecipes(list) {
    localStorage.setItem('recipes', JSON.stringify(list));
  }

  // Ensure seed data exists in localStorage (only once)
  function seedIfEmpty() {
    if (!localStorage.getItem('recipes') && window.SAMPLE_RECIPES) {
      saveRecipes(window.SAMPLE_RECIPES);
    }
  }

  /* -------------------- Index (grid) logic -------------------- */
  function createCardElement(recipe) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <img src="${escapeAttr(recipe.img)}" alt="${escapeAttr(recipe.name)}">
      <div class="card-body">
        <h3>${escapeHtml(recipe.name)}</h3>
        <div class="meta">${escapeHtml(recipe.category)} • ${escapeHtml(recipe.time || '')}</div>
        <p>${escapeHtml(recipe.description || '')}</p>
        <div class="actions">
          <button class="btn-view">View</button>
        </div>
      </div>
    `;
    const btn = div.querySelector('.btn-view');
    btn.addEventListener('click', () => {
      window.location.href = `recipe.html?id=${encodeURIComponent(recipe.id)}`;
    });
    return div;
  }

  function renderGrid(list) {
    const grid = qs('#recipeGrid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!list || list.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#6b7280">No recipes found</p>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach(r => frag.appendChild(createCardElement(r)));
    grid.appendChild(frag);
  }

  function applyFiltersIndex() {
    const searchEl = qs('#search');
    const catEl = qs('#categoryFilter');
    let list = loadRecipes();
    const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const cat = catEl ? catEl.value : 'All';

    if (cat && cat !== 'All') {
      list = list.filter(r => (r.category || '').toLowerCase() === (cat || '').toLowerCase());
    }
    if (q) {
      list = list.filter(r =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (Array.isArray(r.ingredients) ? r.ingredients.join(' ').toLowerCase() : '').includes(q)
      );
    }
    renderGrid(list);
  }

  /* -------------------- Recipe detail logic -------------------- */
  function renderRecipeDetail() {
    const idParam = getQueryParam('id');
    if (!idParam) return; // nothing to do if no id
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      showNotFound();
      return;
    }
    const recipes = loadRecipes();
    const r = recipes.find(x => Number(x.id) === id);
    if (!r) {
      showNotFound();
      return;
    }

    // Populate DOM
    const titleEl = qs('#title');
    const imgEl = qs('#image');
    const descEl = qs('#desc');
    const catEl = qs('#cat');
    const timeEl = qs('#time');
    const ingrEl = qs('#ingredients');
    const stepsEl = qs('#steps');

    if (titleEl) titleEl.innerText = r.name || 'Recipe';
    if (imgEl) imgEl.src = r.img || '';
    if (descEl) descEl.innerText = r.description || '';
    if (catEl) catEl.innerText = r.category || '';
    if (timeEl) timeEl.innerText = r.time || '';

    if (ingrEl) {
      ingrEl.innerHTML = '';
      (Array.isArray(r.ingredients) ? r.ingredients : []).forEach(i => {
        const li = document.createElement('li'); li.innerText = i; ingrEl.appendChild(li);
      });
    }
    if (stepsEl) {
      stepsEl.innerHTML = '';
      (Array.isArray(r.steps) ? r.steps : []).forEach(s => {
        const li = document.createElement('li'); li.innerText = s; stepsEl.appendChild(li);
      });
    }
  }

  function showNotFound() {
    const titleEl = qs('#title');
    if (titleEl) titleEl.innerText = 'Recipe not found';
    const main = qs('.detail-main') || qs('main');
    if (main) {
      main.innerHTML = '<p style="color:#6b7280">Unable to find the requested recipe.</p>';
    }
  }

  /* -------------------- Add recipe logic -------------------- */
  function handleAddForm() {
    const form = qs('#addForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Read values
      const name = (qs('#name') && qs('#name').value.trim()) || '';
      const category = (qs('#category') && qs('#category').value) || 'Other';
      const time = (qs('#time') && qs('#time').value.trim()) || '';
      const img = (qs('#img') && qs('#img').value.trim()) || '';
      const description = (qs('#desc') && qs('#desc').value.trim()) || '';
      const ingredientsRaw = (qs('#ingredients') && qs('#ingredients').value) || '';
      const stepsRaw = (qs('#steps') && qs('#steps').value) || '';

      const ingredients = ingredientsRaw.split('\n').map(s => s.trim()).filter(Boolean);
      const steps = stepsRaw.split('\n').map(s => s.trim()).filter(Boolean);

      if (!name) {
        alert('Please enter a recipe name.');
        return;
      }
      if (!img) {
        // we expect a path like images/xyz.jpg; user can update later
        if (!confirm('No image path provided. Continue without an image?')) return;
      }

      const list = loadRecipes();
      const nextId = list.length ? (Math.max(...list.map(r => Number(r.id) || 0)) + 1) : 1;

      const newRecipe = {
        id: nextId,
        name,
        category,
        time,
        img,
        description,
        ingredients,
        steps
      };

      list.push(newRecipe);
      saveRecipes(list);

      // Redirect to newly added recipe
      window.location.href = `recipe.html?id=${encodeURIComponent(newRecipe.id)}`;
    });
  }

  /* -------------------- Small helpers -------------------- */
  // simple text escapers for safety when injecting into innerHTML
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(str) {
    if (str == null) return '';
    return String(str).replace(/"/g, '&quot;');
  }

  /* -------------------- Page detection & init -------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    seedIfEmpty();

    // INDEX PAGE
    if (qs('#recipeGrid')) {
      // Wire up search and filter if present
      const searchEl = qs('#search');
      const catEl = qs('#categoryFilter');

      // Fallback: if elements missing, create simple search input handlers won't error
      if (searchEl) searchEl.addEventListener('input', debounce(applyFiltersIndex, 150));
      if (catEl) catEl.addEventListener('change', applyFiltersIndex);

      // Initial render
      applyFiltersIndex();
    }

    // RECIPE DETAIL PAGE
    if (qs('.detail-main') || qs('#title')) {
      renderRecipeDetail();
    }

    // ADD-RECIPE PAGE
    if (qs('#addForm')) {
      handleAddForm();
    }
  });

  /* -------------------- Utility: debounce -------------------- */
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
})();
