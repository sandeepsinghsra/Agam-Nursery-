import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("nursery.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    shop_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    gst_number TEXT
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_address TEXT,
    total_amount REAL,
    discount REAL,
    final_amount REAL,
    items TEXT, -- JSON string of items
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add customer_address to sales if it doesn't exist
const tableInfo = db.prepare("PRAGMA table_info(sales)").all() as any[];
const hasAddressColumn = tableInfo.some(col => col.name === 'customer_address');
if (!hasAddressColumn) {
  try {
    db.prepare("ALTER TABLE sales ADD COLUMN customer_address TEXT").run();
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

// Insert default settings if not exists
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
if (settingsCount.count === 0) {
  db.prepare("INSERT INTO settings (id, shop_name) VALUES (1, 'Agam Nursery')").run();
} else {
  // Migration: Update if still using old default
  const currentSettings = db.prepare("SELECT shop_name FROM settings WHERE id = 1").get() as { shop_name: string };
  if (currentSettings.shop_name === 'My Nursery Shop') {
    db.prepare("UPDATE settings SET shop_name = 'Agam Nursery' WHERE id = 1").run();
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  
  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY name").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, price, category } = req.body;
    const result = db.prepare("INSERT INTO products (name, price, category) VALUES (?, ?, ?)").run(name, price, category);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    const { shop_name, address, phone, email, gst_number } = req.body;
    db.prepare(`
      UPDATE settings 
      SET shop_name = ?, address = ?, phone = ?, email = ?, gst_number = ?
      WHERE id = 1
    `).run(shop_name, address, phone, email, gst_number);
    res.json({ success: true });
  });

  // Sales
  app.get("/api/sales", (req, res) => {
    const sales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC").all();
    res.json(sales);
  });

  app.post("/api/sales", (req, res) => {
    const { customer_name, customer_phone, customer_address, total_amount, discount, final_amount, items } = req.body;
    const result = db.prepare(`
      INSERT INTO sales (customer_name, customer_phone, customer_address, total_amount, discount, final_amount, items)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(customer_name, customer_phone, customer_address, total_amount, discount, final_amount, JSON.stringify(items));
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
