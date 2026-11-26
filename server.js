const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const sessions = new Map();
const ARTICLES_FILE = path.join(__dirname, "data", "articles.json");
const SITE_MEDIA_FILE = path.join(__dirname, "data", "site-media.json");
const SITE_MEDIA_KEYS = new Set(["hero", "research", "cover-research", "cover-biotech", "cover-medicine", "cover-biomed"]);
const initialArticles = [
  { id: 1, title: "Genomika: tibbiyotning kelajagini o‘zgartirayotgan yo‘nalish", category: "Tadqiqotlar", text: "Genetik ma’lumotlar kasalliklarni erta aniqlash imkoniyatlarini kengaytirmoqda.", content: "Genomika inson genlari va ularning o‘zaro ta’sirini o‘rganuvchi fan bo‘lib, zamonaviy tibbiyotda tobora muhim o‘rin egallamoqda.\n\nGenetik tahlillar ayrim irsiy kasalliklar xavfini erta baholashga yordam beradi. Shifokorlar bu ma’lumotlardan bemorga mos profilaktika va davolash rejasini tanlashda foydalanishlari mumkin.\n\nGenomik ma’lumotlardan foydalanishda maxfiylik, rozilik va natijalarni mutaxassis bilan to‘g‘ri talqin qilish muhim.", date: "25.11.2026", status: "Faol" },
  { id: 2, title: "Hujayra texnologiyalari va yangi davolash usullari", category: "Biotexnologiya", text: "Laboratoriya yutuqlari regenerativ tibbiyot uchun yangi istiqbollarni ochmoqda.", content: "Hujayra texnologiyalari tirik hujayralarni o‘rganish va ulardan tibbiy tadqiqotlarda foydalanishga asoslanadi.\n\nRegenerativ tibbiyot shikastlangan to‘qimalarni tiklash imkoniyatlarini izlaydi. Hujayra terapiyalarining ko‘plab yo‘nalishlari hanuz klinik tadqiqot bosqichida bo‘lib, ularning xavfsizligi va samaradorligi sinchiklab baholanadi.\n\nYangi usullarni qo‘llash faqat tegishli klinik dalillar va tibbiy mutaxassis nazorati bilan amalga oshirilishi kerak.", date: "24.11.2026", status: "Faol" },
  { id: 3, title: "Raqamli diagnostika: aniqlik va tezkorlik", category: "Tibbiyot", text: "Ma’lumotlar tahlili va aqlli tizimlarning o‘rni tobora ortib bormoqda.", content: "Raqamli diagnostika tibbiy tasvirlar, laboratoriya natijalari va boshqa ma’lumotlarni tahlil qilish vositalaridan foydalanadi.\n\nBunday tizimlar shifokorga ma’lumotlarni tartiblash va ayrim belgilarni aniqlashda ko‘maklashishi mumkin, ammo tashxis va davolash bo‘yicha yakuniy qarorni malakali tibbiyot mutaxassisi qabul qiladi.\n\nAniqlikni oshirish uchun ma’lumotlar sifati, algoritmlarni sinovdan o‘tkazish va bemor maxfiyligini himoyalash zarur.", date: "23.11.2026", status: "Faol" },
  { id: 4, title: "Molekulyar biologiya: tiriklik sirlarini anglash", category: "Biotibbiyot", text: "Molekulyar darajadagi bilimlar zamonaviy tibbiyotning muhim asosidir.", content: "Molekulyar biologiya hujayralardagi DNK, RNK va oqsillar kabi tuzilmalar hamda ularning vazifalarini o‘rganadi.\n\nBu bilimlar hujayralar qanday ishlashi, ayrim kasalliklar qanday rivojlanishi va yangi dori vositalarini izlash jarayonlarini tushunishga yordam beradi.\n\nLaboratoriya kashfiyotlarini kundalik tibbiyotga tatbiq etish uchun takroriy tadqiqotlar, klinik sinovlar va mustaqil ekspert bahosi talab etiladi.", date: "22.11.2026", status: "Faol" }
];

if (!ADMIN_USER || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_USER va ADMIN_PASSWORD muhit o‘zgaruvchilarini sozlang.");
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "3mb" }));

function readArticles() {
  if (!fs.existsSync(ARTICLES_FILE)) {
    fs.mkdirSync(path.dirname(ARTICLES_FILE), { recursive: true });
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(initialArticles, null, 2));
  }
  return JSON.parse(fs.readFileSync(ARTICLES_FILE, "utf8"));
}

function writeArticles(articles) {
  fs.mkdirSync(path.dirname(ARTICLES_FILE), { recursive: true });
  fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
}

function readSiteMedia() {
  if (!fs.existsSync(SITE_MEDIA_FILE)) return {};
  return JSON.parse(fs.readFileSync(SITE_MEDIA_FILE, "utf8"));
}

function writeSiteMedia(media) {
  fs.mkdirSync(path.dirname(SITE_MEDIA_FILE), { recursive: true });
  fs.writeFileSync(SITE_MEDIA_FILE, JSON.stringify(media, null, 2));
}

function isValidImage(image) {
  return typeof image === "string" &&
    /^data:image\/(?:jpeg|png|webp);base64,/.test(image) &&
    image.length <= 2100000;
}

function getSession(req) {
  const cookie = (req.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("admin_session="));
  if (!cookie) return null;
  const session = sessions.get(cookie.split("=")[1]);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(cookie.split("=")[1]);
    return null;
  }
  return session;
}

function requireAdmin(req, res, next) {
  if (getSession(req)) return next();
  res.redirect("/admin/login");
}

function requireAdminApi(req, res, next) {
  if (getSession(req)) return next();
  res.status(401).json({ error: "Admin hisobiga kiring." });
}

app.get("/health", (_req, res) => res.json({ status: "ok", app: "Biotibbiyot" }));
app.get("/api/articles", (_req, res) => {
  try {
    res.json(readArticles());
  } catch (error) {
    console.error("Maqolalarni o‘qib bo‘lmadi:", error);
    res.status(500).json({ error: "Maqolalarni yuklab bo‘lmadi." });
  }
});
app.get("/api/site-media", (_req, res) => {
  try {
    res.json(readSiteMedia());
  } catch (error) {
    console.error("Sayt rasmlarini o‘qib bo‘lmadi:", error);
    res.status(500).json({ error: "Sayt rasmlarini yuklab bo‘lmadi." });
  }
});
app.put("/api/admin/site-media/:key", requireAdminApi, (req, res) => {
  const { key } = req.params;
  const { image } = req.body;
  if (!SITE_MEDIA_KEYS.has(key)) return res.status(404).json({ error: "Bu rasm turi mavjud emas." });
  if (!isValidImage(image)) return res.status(400).json({ error: "JPG, PNG yoki WebP formatida, 1.5 MB gacha rasm tanlang." });
  try {
    const media = readSiteMedia();
    media[key] = image;
    writeSiteMedia(media);
    res.json({ key, image });
  } catch (error) {
    console.error("Sayt rasmini saqlab bo‘lmadi:", error);
    res.status(500).json({ error: "Rasmni saqlashda xatolik yuz berdi." });
  }
});
app.delete("/api/admin/site-media/:key", requireAdminApi, (req, res) => {
  const { key } = req.params;
  if (!SITE_MEDIA_KEYS.has(key)) return res.status(404).json({ error: "Bu rasm turi mavjud emas." });
  try {
    const media = readSiteMedia();
    delete media[key];
    writeSiteMedia(media);
    res.status(204).end();
  } catch (error) {
    console.error("Sayt rasmini tiklab bo‘lmadi:", error);
    res.status(500).json({ error: "Standart rasmni tiklashda xatolik yuz berdi." });
  }
});
app.post("/api/admin/articles", requireAdminApi, (req, res) => {
  const { title, category, text, content, image } = req.body;
  if (![title, category, text, content].every(value => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "Maqola nomi, kategoriya, qisqa tavsif va to‘liq matnni kiriting." });
  }
  if (image && !isValidImage(image)) {
    return res.status(400).json({ error: "Rasm formati yoki hajmi noto‘g‘ri." });
  }
  try {
    const articles = readArticles();
    const article = { id: Date.now(), title: title.trim(), category: category.trim(), text: text.trim(), content: content.trim(), image: image || "", date: new Date().toLocaleDateString("uz-UZ"), status: "Faol" };
    articles.push(article);
    writeArticles(articles);
    res.status(201).json(article);
  } catch (error) {
    console.error("Maqolani saqlab bo‘lmadi:", error);
    res.status(500).json({ error: "Maqolani saqlashda xatolik yuz berdi." });
  }
});
app.put("/api/admin/articles/:id", requireAdminApi, (req, res) => {
  const { title, category, text, content, image } = req.body;
  if (![title, category, text, content].every(value => typeof value === "string" && value.trim())) {
    return res.status(400).json({ error: "Maqola nomi, kategoriya, qisqa tavsif va to‘liq matnni kiriting." });
  }
  if (image && !isValidImage(image)) {
    return res.status(400).json({ error: "Rasm formati yoki hajmi noto‘g‘ri." });
  }
  try {
    const articles = readArticles();
    const index = articles.findIndex(article => String(article.id) === req.params.id);
    if (index < 0) return res.status(404).json({ error: "Maqola topilmadi." });
    articles[index] = { ...articles[index], title: title.trim(), category: category.trim(), text: text.trim(), content: content.trim(), image: image || "", date: new Date().toLocaleDateString("uz-UZ") };
    writeArticles(articles);
    res.json(articles[index]);
  } catch (error) {
    console.error("Maqolani yangilab bo‘lmadi:", error);
    res.status(500).json({ error: "Maqolani yangilashda xatolik yuz berdi." });
  }
});
app.delete("/api/admin/articles/:id", requireAdminApi, (req, res) => {
  try {
    const articles = readArticles();
    const remaining = articles.filter(article => String(article.id) !== req.params.id);
    if (remaining.length === articles.length) return res.status(404).json({ error: "Maqola topilmadi." });
    writeArticles(remaining);
    res.status(204).end();
  } catch (error) {
    console.error("Maqolani o‘chirib bo‘lmadi:", error);
    res.status(500).json({ error: "Maqolani o‘chirishda xatolik yuz berdi." });
  }
});
app.get("/admin/login", (req, res) => {
  if (getSession(req)) return res.redirect("/admin");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.post("/admin/login", (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  const providedUser = Buffer.from(username);
  const expectedUser = Buffer.from(ADMIN_USER);
  const providedPassword = Buffer.from(password);
  const expectedPassword = Buffer.from(ADMIN_PASSWORD);
  const usernameMatches = providedUser.length === expectedUser.length && crypto.timingSafeEqual(providedUser, expectedUser);
  const passwordMatches = providedPassword.length === expectedPassword.length && crypto.timingSafeEqual(providedPassword, expectedPassword);
  if (!usernameMatches || !passwordMatches) return res.redirect("/admin/login?error=1");

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { username: ADMIN_USER, expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader("Set-Cookie", `admin_session=${token}; HttpOnly; Path=/; SameSite=Strict`);
  res.redirect("/admin");
});
app.post("/admin/logout", (req, res) => {
  const cookie = (req.headers.cookie || "").split(";").map(value => value.trim()).find(value => value.startsWith("admin_session="));
  if (cookie) sessions.delete(cookie.split("=")[1]);
  res.setHeader("Set-Cookie", "admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict");
  res.redirect("/admin/login");
});
app.get(["/admin", "/admin.html", "/admin.js", "/admin.css"], requireAdmin, (req, res) => {
  if (req.path === "/admin" || req.path === "/admin.html") return res.sendFile(path.join(__dirname, "public", "admin.html"));
  res.sendFile(path.join(__dirname, "public", req.path.slice(1)));
});
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Biotibbiyot ishga tushdi: http://localhost:${PORT}`);
});