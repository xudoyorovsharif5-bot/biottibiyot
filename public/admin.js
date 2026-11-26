let articles = [];
let selectedImage = "";
function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value || "";
  return element.innerHTML;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

async function requestArticles(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Admin hisobiga qayta kiring.");
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "So‘rov bajarilmadi.");
  }
  return response.status === 204 ? null : response.json();
}

function renderArticles() {
  document.getElementById("articleCount").textContent = articles.length;
  document.getElementById("articleTable").innerHTML = articles.map(article => `
    <tr>
      <td class="table-article">${article.image ? `<img src="${article.image}" alt="">` : ""}<strong>${escapeHtml(article.title)}</strong></td>
      <td>${escapeHtml(article.category)}</td>
      <td><span class="status">${escapeHtml(article.status)}</span></td>
      <td>${escapeHtml(article.date)}</td>
      <td><div class="row-actions"><button data-edit="${article.id}" title="Tahrirlash">✎</button><button data-delete="${article.id}" title="O‘chirish">×</button></div></td>
    </tr>`).join("");
  document.getElementById("recentArticles").innerHTML = articles.slice(-3).reverse().map(article => `
    <div class="recent-item"><div class="recent-thumb">${article.image ? `<img src="${article.image}" alt="">` : ""}</div><div><strong>${escapeHtml(article.title)}</strong><small>${escapeHtml(article.category)} • ${escapeHtml(article.date)}</small></div></div>`).join("");
}

async function loadArticles() {
  articles = await requestArticles("/api/articles");
  renderArticles();
}

function showMediaPreview(card, image) {
  const preview = card.querySelector(".media-preview");
  const img = preview.querySelector("img");
  preview.classList.toggle("has-custom-image", Boolean(image));
  const source = image || card.dataset.defaultSrc;
  img.hidden = !source;
  if (source) img.src = source;
}

async function loadSiteMedia() {
  const media = await requestArticles("/api/site-media");
  document.querySelectorAll(".media-card").forEach(card => {
    const savedImage = media[card.dataset.mediaKey] || "";
    card.dataset.savedImage = savedImage;
    showMediaPreview(card, savedImage);
    card.querySelector("[data-reset-media]").hidden = !savedImage;
  });
}

document.querySelectorAll("[data-media-file]").forEach(input => {
  input.addEventListener("change", () => {
    const card = input.closest(".media-card");
    const file = input.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      input.value = "";
      showToast("JPG, PNG yoki WebP formatidagi rasm tanlang.");
      return;
    }
    if (file.size > 1500000) {
      input.value = "";
      showToast("Rasm hajmi 1.5 MB dan kichik bo‘lishi kerak.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => showToast("Rasmni o‘qib bo‘lmadi.");
    reader.onload = () => {
      card.dataset.pendingImage = reader.result;
      showMediaPreview(card, reader.result);
      card.querySelector("[data-save-media]").disabled = false;
    };
    reader.readAsDataURL(file);
  });
});

document.querySelectorAll("[data-save-media]").forEach(button => {
  button.addEventListener("click", async () => {
    const card = button.closest(".media-card");
    button.disabled = true;
    try {
      const saved = await requestArticles(`/api/admin/site-media/${encodeURIComponent(card.dataset.mediaKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: card.dataset.pendingImage })
      });
      card.dataset.savedImage = saved.image;
      delete card.dataset.pendingImage;
      card.querySelector("[data-media-file]").value = "";
      card.querySelector("[data-reset-media]").hidden = false;
      showMediaPreview(card, saved.image);
      showToast("Sayt rasmi saqlandi.");
    } catch (error) {
      button.disabled = false;
      showToast(error.message);
    }
  });
});

document.querySelectorAll("[data-reset-media]").forEach(button => {
  button.addEventListener("click", async () => {
    const card = button.closest(".media-card");
    button.disabled = true;
    try {
      await requestArticles(`/api/admin/site-media/${encodeURIComponent(card.dataset.mediaKey)}`, { method: "DELETE" });
      card.dataset.savedImage = "";
      delete card.dataset.pendingImage;
      card.querySelector("[data-media-file]").value = "";
      card.querySelector("[data-save-media]").disabled = true;
      button.hidden = true;
      showMediaPreview(card, "");
      showToast("Standart rasm tiklandi.");
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  });
});

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.getElementById(`${button.dataset.view}View`).classList.add("active");
    document.getElementById("pageTitle").textContent = {
      dashboard: "Boshqaruv paneli", articles: "Maqolalar", media: "Sayt rasmlari", subscribers: "Obunachilar", settings: "Sozlamalar"
    }[button.dataset.view];
    document.querySelector(".sidebar").classList.remove("open");
  });
});

document.getElementById("mobileMenu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
const dialog = document.getElementById("articleDialog");
const imageInput = document.getElementById("articleImage");
const imagePreview = document.getElementById("imagePreview");

function resetImagePreview() {
  selectedImage = "";
  imagePreview.innerHTML = "<span>Rasm tanlanmagan</span>";
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    imageInput.value = "";
    showToast("JPG, PNG yoki WebP formatidagi rasm tanlang.");
    return;
  }
  if (file.size > 1500000) {
    imageInput.value = "";
    showToast("Rasm hajmi 1.5 MB dan kichik bo‘lishi kerak.");
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => showToast("Rasmni o‘qib bo‘lmadi.");
  reader.onload = () => {
    selectedImage = reader.result;
    imagePreview.innerHTML = `<img src="${selectedImage}" alt="Maqola rasmi ko‘rinishi">`;
  };
  reader.readAsDataURL(file);
});

document.getElementById("newArticle").addEventListener("click", () => {
  document.getElementById("articleForm").reset();
  document.getElementById("articleId").value = "";
  document.getElementById("articleContent").value = "";
  resetImagePreview();
  document.getElementById("dialogTitle").textContent = "Yangi maqola";
  dialog.showModal();
});
document.getElementById("closeDialog").addEventListener("click", () => dialog.close());

document.getElementById("articleTable").addEventListener("click", async event => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.edit) {
    const article = articles.find(item => String(item.id) === button.dataset.edit);
    if (!article) return;
    document.getElementById("articleId").value = article.id;
    document.getElementById("articleTitle").value = article.title;
    document.getElementById("articleCategory").value = article.category;
    document.getElementById("articleText").value = article.text;
    document.getElementById("articleContent").value = article.content || article.text;
    selectedImage = article.image || "";
    imagePreview.innerHTML = selectedImage ? `<img src="${selectedImage}" alt="Maqola rasmi">` : "<span>Rasm tanlanmagan</span>";
    document.getElementById("dialogTitle").textContent = "Maqolani tahrirlash";
    dialog.showModal();
  }
  if (button.dataset.delete) {
    button.disabled = true;
    try {
      await requestArticles(`/api/admin/articles/${encodeURIComponent(button.dataset.delete)}`, { method: "DELETE" });
      articles = articles.filter(item => String(item.id) !== button.dataset.delete);
      renderArticles();
      showToast("Maqola o‘chirildi.");
    } catch (error) {
      button.disabled = false;
      showToast(error.message);
    }
  }
});

document.getElementById("articleForm").addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("articleId").value;
  const data = {
    title: document.getElementById("articleTitle").value.trim(),
    category: document.getElementById("articleCategory").value,
    text: document.getElementById("articleText").value.trim(),
    content: document.getElementById("articleContent").value.trim(),
    image: selectedImage
  };
  const submitButton = event.currentTarget.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    const saved = await requestArticles(id ? `/api/admin/articles/${encodeURIComponent(id)}` : "/api/admin/articles", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (id) articles = articles.map(article => String(article.id) === id ? saved : article);
    else articles.push(saved);
    renderArticles();
    dialog.close();
    showToast("Maqola saqlandi.");
  } catch (error) {
    showToast(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById("subscriberList").innerHTML = '<p class="empty-admin">Obunachilar ro‘yxati hali mavjud emas.</p>';
document.getElementById("subscriberCount").textContent = "0";
document.getElementById("subscriberBadge").textContent = "0 ta";
document.getElementById("saveSettings").addEventListener("click", () => {
  localStorage.setItem("biotibbiyotSettings", JSON.stringify({
    siteName: document.getElementById("siteName").value,
    adminEmail: document.getElementById("adminEmail").value
  }));
  showToast("Sozlamalar saqlandi.");
});

const savedSettings = JSON.parse(localStorage.getItem("biotibbiyotSettings"));
if (savedSettings) {
  document.getElementById("siteName").value = savedSettings.siteName;
  document.getElementById("adminEmail").value = savedSettings.adminEmail;
}
loadArticles().catch(error => showToast(error.message));
loadSiteMedia().catch(error => showToast(error.message));
