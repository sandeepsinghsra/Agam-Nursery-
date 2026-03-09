// @ts-nocheck
import { useState, useMemo, useEffect } from "react";

// ─── PDF Generator ────────────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((res) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res;
    document.head.appendChild(s);
  });
}

async function generateBillPDF(sale, settings) {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  let y = 14;

  doc.setFillColor(45, 90, 39);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text(settings.shop_name || "Agam Nursery", W / 2, y + 6, { align: "center" });
  doc.setFontSize(8); doc.setFont("helvetica", "normal");
  if (settings.address) doc.text(settings.address, W / 2, y + 13, { align: "center" });
  if (settings.phone) doc.text(`Ph: ${settings.phone}`, W / 2, y + 19, { align: "center" });
  if (settings.gst_number) doc.text(`GST: ${settings.gst_number}`, W / 2, y + 25, { align: "center" });

  y = 46;
  doc.setTextColor(30, 30, 30);
  doc.setFillColor(240, 247, 240);
  doc.roundedRect(8, y, W - 16, 24, 3, 3, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text(`Bill No: #${sale.id}`, 12, y + 6);
  doc.text(`Date: ${new Date(sale.created_at).toLocaleString("en-IN")}`, 12, y + 12);
  doc.text(`Customer: ${sale.customer_name || "Walk-in"}`, 12, y + 18);
  if (sale.customer_phone) doc.text(`Phone: ${sale.customer_phone}`, W - 10, y + 6, { align: "right" });
  if (sale.customer_address) { const a = doc.splitTextToSize(`Addr: ${sale.customer_address}`, 50); doc.text(a, W - 10, y + 12, { align: "right" }); }
  const pm = sale.payment_mode || "Cash";
  doc.text(`Payment: ${pm}${sale.is_credit ? " (UDHAR)" : ""}`, W - 10, y + 20, { align: "right" });
  y += 30;

  // Table
  doc.setFillColor(45, 90, 39);
  doc.rect(8, y, W - 16, 8, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  doc.text("Item", 12, y + 5.5);
  doc.text("Qty", W * 0.60, y + 5.5, { align: "center" });
  doc.text("Rate", W * 0.75, y + 5.5, { align: "center" });
  doc.text("Total", W - 10, y + 5.5, { align: "right" });
  y += 8;

  doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "normal");
  sale.items.forEach((item, i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 252, 248); doc.rect(8, y, W - 16, 7, "F"); }
    doc.text(item.name.slice(0, 22), 12, y + 5);
    doc.text(String(item.quantity), W * 0.60, y + 5, { align: "center" });
    doc.text(`Rs.${item.price}`, W * 0.75, y + 5, { align: "center" });
    doc.text(`Rs.${item.total}`, W - 10, y + 5, { align: "right" });
    y += 7;
  });

  y += 4;
  doc.setDrawColor(200, 225, 200); doc.line(8, y, W - 8, y); y += 5;
  doc.setFontSize(8);
  doc.text("Subtotal:", W - 48, y); doc.text(`Rs.${sale.total_amount}`, W - 10, y, { align: "right" }); y += 6;
  if (sale.discount > 0) {
    doc.setTextColor(180, 30, 30);
    doc.text("Discount:", W - 48, y); doc.text(`-Rs.${sale.discount}`, W - 10, y, { align: "right" }); y += 6;
    doc.setTextColor(30, 30, 30);
  }
  doc.setFillColor(45, 90, 39);
  doc.roundedRect(W - 72, y - 2, 64, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.text("TOTAL:", W - 68, y + 5.5);
  doc.text(`Rs.${sale.final_amount}`, W - 10, y + 5.5, { align: "right" });
  y += 18;

  if (sale.is_credit) {
    doc.setTextColor(200, 80, 0); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text(`CREDIT/UDHAR - Amount Due: Rs.${sale.final_amount}`, W / 2, y, { align: "center" }); y += 10;
  }

  doc.setTextColor(120, 150, 120); doc.setFontSize(8); doc.setFont("helvetica", "italic");
  doc.text("Thank you for shopping with us!", W / 2, y + 6, { align: "center" });
  doc.text("Please visit again 🌿", W / 2, y + 12, { align: "center" });

  doc.save(`Bill_${sale.customer_name || "Customer"}_#${sale.id}.pdf`);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 20, color = "currentColor", sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  cart: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  history: "M12 8v4l3 3M3.05 11a9 9 0 1 0 .5-3M3 4v4h4",
  sett: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  wa: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  pdf: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  trend: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  pkg: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  credit: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  leaf: "M17 8C8 10 5.9 16.17 3.82 19.41a1 1 0 001.35 1.37C7 19 8 18.9 9 19a6 6 0 006-6c0-1.8-.82-3.4-2-4.47M7 15c0-3 2-5 4-7",
  menu: "M3 12h18M3 6h18M3 18h18",
  chevr: "M9 18l6-6-6-6",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const G = "#2d5a27", GL = "#e8f0e6";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const ld = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = {
  phone: { width: 390, minHeight: 844, background: "#f5f7f2", borderRadius: 48, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 50px 120px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)", fontFamily: "'Georgia','Times New Roman',serif", position: "relative" },
  hdr: { background: G, color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  nav: { display: "flex", background: "#fff", borderTop: "1px solid #e8ede6", flexShrink: 0 },
  nb: (a) => ({ flex: 1, padding: "10px 4px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "none", cursor: "pointer", color: a ? G : "#9aab97", fontSize: 10, fontFamily: "Georgia,serif", borderTop: a ? `2px solid ${G}` : "2px solid transparent", transition: "all 0.2s" }),
  card: { background: "#fff", borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: "0 2px 12px rgba(45,90,39,0.06)" },
  inp: { width: "100%", border: "1px solid #dce8da", borderRadius: 10, padding: "10px 12px", fontSize: 14, fontFamily: "Georgia,serif", background: "#fafcf9", outline: "none", boxSizing: "border-box" },
  btn: (v = "primary") => ({
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", borderRadius: 14, padding: "12px 20px", fontSize: 14, fontFamily: "Georgia,serif", cursor: "pointer", fontWeight: 600,
    ...(v === "primary" ? { background: G, color: "#fff", boxShadow: "0 4px 14px rgba(45,90,39,0.3)" } :
      v === "ghost" ? { background: GL, color: G } :
      v === "danger" ? { background: "#fee2e2", color: "#dc2626" } :
      { background: "#fff", color: "#555", border: "1px solid #ddd" })
  }),
  ov: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modal: { background: "#fff", borderRadius: "28px 28px 0 0", padding: "24px 20px 36px", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto" },
  lbl: { fontSize: 11, fontWeight: 700, color: "#9aab97", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 5 },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#1a2e1a", color: "#fff", padding: "12px 24px", borderRadius: 50, fontSize: 13, fontFamily: "Georgia,serif", zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>✓ {msg}</div>;
}

// ─── Credit Item (separate component for useState) ────────────────────────────
function CreditItem({ cr, onPaid, onWA }) {
  const due = cr.amount - cr.paid;
  const [payAmt, setPayAmt] = useState(due);
  return (
    <div style={{ ...st.card, borderLeft: "4px solid #ff9800", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{cr.customer_name || "Walk-in"}</div>
          <div style={{ fontSize: 12, color: "#9aab97" }}>{cr.customer_phone} · Bill #{cr.sale_id}</div>
          <div style={{ fontSize: 12, color: "#9aab97" }}>{fmtDate(cr.created_at)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e65100" }}>₹{due}</div>
          <div style={{ fontSize: 11, color: "#9aab97" }}>of ₹{cr.amount}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="number" value={payAmt} onChange={e => setPayAmt(parseFloat(e.target.value) || 0)}
          style={{ ...st.inp, flex: 1, padding: "8px 12px", fontSize: 13 }} />
        <button onClick={() => onPaid(cr.id, payAmt)} style={{ ...st.btn("primary"), padding: "8px 14px", borderRadius: 12, fontSize: 13 }}>
          <Ic d={I.check} size={16} color="#fff" /> Paid
        </button>
        <button onClick={() => onWA(cr)} style={{ ...st.btn("ghost"), padding: "8px", borderRadius: 12 }}>
          <Ic d={I.wa} size={16} color={G} />
        </button>
      </div>
    </div>
  );
}

// ─── Billing Tab inner (separate for useState category) ──────────────────────
function BillingTab({ products, cart, addToCart, updateQty, removeFromCart, cName, setCName, cPhone, setCPhone, cAddr, setCAddr, discount, setDiscount, manualTotal, setManualTotal, payMode, setPayMode, isCredit, setIsCredit, showItemDisc, setShowItemDisc, generateBill, subtotal, itemDiscTotal, finalTotal, searchQ, setSearchQ }) {
  const [selCat, setSelCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(products.map(p => p.category || "General")))];
  const fp = products.filter(p =>
    (selCat === "All" || (p.category || "General") === selCat) &&
    (p.name.toLowerCase().includes(searchQ.toLowerCase()) || (p.category || "").toLowerCase().includes(searchQ.toLowerCase()))
  );
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Ic d={I.search} size={16} color="#9aab97" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input style={{ ...st.inp, paddingLeft: 36 }} placeholder="Search products..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>
      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
        {cats.map(c => (
          <button key={c} onClick={() => setSelCat(c)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", background: selCat === c ? G : GL, color: selCat === c ? "#fff" : G, fontSize: 12, fontFamily: "Georgia,serif", fontWeight: 700, cursor: "pointer" }}>{c}</button>
        ))}
      </div>
      {/* Products grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {fp.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "30px 0", color: "#9aab97", fontSize: 14 }}>{products.length === 0 ? "No products. Add from Products tab." : "No results."}</div>}
        {fp.map(p => (
          <button key={p.id} onClick={() => addToCart(p)}
            style={{ background: "#fff", border: `2px solid ${p.stock != null && p.stock <= 0 ? "#fca5a5" : GL}`, borderRadius: 16, padding: "12px 14px", textAlign: "left", cursor: p.stock != null && p.stock <= 0 ? "not-allowed" : "pointer", opacity: p.stock != null && p.stock <= 0 ? 0.6 : 1 }}>
            <div style={{ fontSize: 10, color: "#9aab97", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{p.category || "General"}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2d3a2b", marginBottom: 4 }}>{p.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: G }}>₹{p.price}</div>
              {p.stock != null && <div style={{ fontSize: 10, color: p.stock <= 5 ? "#dc2626" : "#9aab97", fontWeight: 700 }}>{p.stock <= 0 ? "Out" : `${p.stock} left`}</div>}
            </div>
          </button>
        ))}
      </div>
      {/* Cart */}
      {cart.length > 0 && (
        <div style={st.card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: G, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Ic d={I.cart} size={16} color={G} /> Cart ({cart.length} items)
          </div>
          {cart.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #f0f4ef" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#9aab97" }}>₹{item.price}{item.discount > 0 ? ` (−₹${item.discount}/unit)` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: 28, height: 28, border: `1px solid ${GL}`, borderRadius: 8, background: GL, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: G, fontWeight: 700 }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 22, textAlign: "center" }}>{item.quantity}</span>
                <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: 28, height: 28, border: `1px solid ${GL}`, borderRadius: 8, background: GL, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: G, fontWeight: 700 }}>+</button>
              </div>
              <div style={{ textAlign: "right", minWidth: 54 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>₹{item.total}</div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Ic d={I.trash} size={14} color="#dc2626" /></button>
              </div>
            </div>
          ))}
          {/* Customer info */}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={st.lbl}>Customer Name</label><input style={st.inp} placeholder="Name" value={cName} onChange={e => setCName(e.target.value)} /></div>
            <div><label style={st.lbl}>Phone</label><input style={st.inp} placeholder="+91..." value={cPhone} onChange={e => setCPhone(e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 10 }}><label style={st.lbl}>Address</label><input style={st.inp} placeholder="Address (optional)" value={cAddr} onChange={e => setCAddr(e.target.value)} /></div>
          {/* Payment mode */}
          <div style={{ marginTop: 12 }}>
            <label style={st.lbl}>Payment Mode</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Cash", "UPI", "Card", "Udhar"].map(m => (
                <button key={m} onClick={() => { setPayMode(m); setIsCredit(m === "Udhar"); }}
                  style={{ flex: 1, padding: "8px 4px", border: "none", borderRadius: 10, background: payMode === m ? (m === "Udhar" ? "#fff3e0" : G) : GL, color: payMode === m ? (m === "Udhar" ? "#e65100" : "#fff") : G, fontSize: 12, fontFamily: "Georgia,serif", fontWeight: 700, cursor: "pointer" }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          {/* Totals */}
          <div style={{ background: GL, borderRadius: 14, padding: 14, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: "#5a7057" }}>Subtotal</span><span style={{ fontWeight: 600 }}>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#5a7057" }}>Discount</span>
                <button onClick={() => setShowItemDisc(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Ic d={I.tag} size={14} color={G} /></button>
              </div>
              <input type="number" value={discount} onChange={e => { setDiscount(parseFloat(e.target.value) || 0); setManualTotal(null); }}
                style={{ ...st.inp, width: 70, textAlign: "right", padding: "4px 8px", fontSize: 13 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${G}30`, paddingTop: 10 }}>
              <span style={{ fontWeight: 700, color: G }}>Grand Total</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: G, fontWeight: 700 }}>₹</span>
                <input type="number" value={finalTotal} onChange={e => setManualTotal(parseFloat(e.target.value))}
                  style={{ background: "none", border: "none", fontWeight: 700, fontSize: 20, color: G, width: 80, textAlign: "right", outline: "none", fontFamily: "Georgia,serif" }} />
              </div>
            </div>
          </div>
          {isCredit && <div style={{ background: "#fff3e0", borderRadius: 10, padding: "8px 12px", marginTop: 8, fontSize: 13, color: "#e65100", fontWeight: 700 }}>⚠️ UDHAR — will be recorded as credit</div>}
          <button onClick={generateBill} style={{ ...st.btn("primary"), width: "100%", marginTop: 14, padding: "14px" }}>
            <Ic d={I.cart} size={18} color="#fff" /> Generate Bill
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function AgamNursery() {
  const [tab, setTab] = useState("billing");
  const [user, setUser] = useState(() => ld("agam_user", null));
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const showToast = (m) => setToast(m);

  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [credits, setCredits] = useState([]);
  const [settings, setSettings] = useState({ shop_name: "Agam Nursery", address: "", phone: "", email: "", gst_number: "" });

  // Billing state
  const [cart, setCart] = useState([]);
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("+91");
  const [cAddr, setCAddr] = useState("");
  const [discount, setDiscount] = useState(0);
  const [manualTotal, setManualTotal] = useState(null);
  const [payMode, setPayMode] = useState("Cash");
  const [isCredit, setIsCredit] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // Modals
  const [showShare, setShowShare] = useState(false);
  const [showItemDisc, setShowItemDisc] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [selSale, setSelSale] = useState(null);
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("all");
  const [incomeRange, setIncomeRange] = useState("weekly");

  // Product form
  const [pName, setPName] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCat, setPCat] = useState("");
  const [pStock, setPStock] = useState("");
  const [editProd, setEditProd] = useState(null);

  useEffect(() => {
    if (user) {
      setProducts(ld(`agam_products_${user}`, []));
      setSales(ld(`agam_sales_${user}`, []));
      setCredits(ld(`agam_credits_${user}`, []));
      setSettings(ld(`agam_settings_${user}`, { shop_name: "Agam Nursery", address: "", phone: "", email: "", gst_number: "" }));
    }
  }, [user]);

  // Auth
  const handleAuth = () => {
    setAuthErr("");
    const users = ld("agam_users", {});
    if (authMode === "signup") {
      if (users[authEmail]) { setAuthErr("Email already registered."); return; }
      users[authEmail] = { password: authPass };
      sv("agam_users", users); sv("agam_user", authEmail); setUser(authEmail);
    } else {
      if (!users[authEmail] || users[authEmail].password !== authPass) { setAuthErr("Invalid email or password."); return; }
      sv("agam_user", authEmail); setUser(authEmail);
    }
  };
  const logout = () => { sv("agam_user", null); setUser(null); setCart([]); setProducts([]); setSales([]); };

  // Products
  const saveProduct = () => {
    if (!pName || !pPrice) return;
    if (editProd) {
      const u = products.map(p => p.id === editProd.id ? { ...p, name: pName, price: parseFloat(pPrice), category: pCat, stock: pStock !== "" ? parseInt(pStock) : null } : p);
      setProducts(u); sv(`agam_products_${user}`, u); setEditProd(null);
    } else {
      const p = { id: Date.now(), name: pName, price: parseFloat(pPrice), category: pCat, stock: pStock !== "" ? parseInt(pStock) : null };
      const u = [...products, p]; setProducts(u); sv(`agam_products_${user}`, u);
    }
    setPName(""); setPPrice(""); setPCat(""); setPStock("");
    showToast(editProd ? "Product updated!" : "Product added!");
  };
  const delProduct = (id) => { const u = products.filter(p => p.id !== id); setProducts(u); sv(`agam_products_${user}`, u); };
  const startEdit = (p) => { setEditProd(p); setPName(p.name); setPPrice(String(p.price)); setPCat(p.category || ""); setPStock(p.stock != null ? String(p.stock) : ""); };
  const updateStock = (id, delta) => {
    const u = products.map(p => p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p);
    setProducts(u); sv(`agam_products_${user}`, u);
  };
  const lowStock = products.filter(p => p.stock != null && p.stock <= 5);

  // Billing
  const addToCart = (product) => {
    if (product.stock != null && product.stock <= 0) { showToast("Out of stock!"); return; }
    const ex = cart.find(i => i.id === product.id);
    if (ex) setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price - (i.quantity + 1) * (i.discount || 0) } : i));
    else setCart([...cart, { ...product, quantity: 1, total: product.price, discount: 0 }]);
    setManualTotal(null);
  };
  const removeFromCart = (id) => { setCart(cart.filter(i => i.id !== id)); setManualTotal(null); };
  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCart(cart.map(i => i.id === id ? { ...i, quantity: qty, total: qty * i.price - qty * (i.discount || 0) } : i));
    setManualTotal(null);
  };
  const updateItemDisc = (id, d) => {
    setCart(cart.map(i => i.id === id ? { ...i, discount: d, total: i.quantity * i.price - i.quantity * d } : i));
    setManualTotal(null);
  };

  const subtotal = useMemo(() => cart.reduce((a, i) => a + i.price * i.quantity, 0), [cart]);
  const itemDiscTotal = useMemo(() => cart.reduce((a, i) => a + (i.discount || 0) * i.quantity, 0), [cart]);
  const calcTotal = subtotal - discount - itemDiscTotal;
  const finalTotal = manualTotal !== null ? manualTotal : calcTotal;

  const generateBill = () => {
    if (cart.length === 0 || !user) return;
    const newId = sales.length > 0 ? Math.max(...sales.map(x => x.id)) + 1 : 1001;
    const sale = { id: newId, customer_name: cName, customer_phone: cPhone, customer_address: cAddr, total_amount: subtotal, discount: discount + itemDiscTotal, final_amount: finalTotal, items: cart, created_at: new Date().toISOString(), payment_mode: payMode, is_credit: isCredit };
    const updSales = [sale, ...sales]; setSales(updSales); sv(`agam_sales_${user}`, updSales);
    // Deduct stock
    const updProds = products.map(p => { const ci = cart.find(i => i.id === p.id); return (ci && p.stock != null) ? { ...p, stock: Math.max(0, p.stock - ci.quantity) } : p; });
    setProducts(updProds); sv(`agam_products_${user}`, updProds);
    // Credit
    if (isCredit) {
      const cr = { id: Date.now(), sale_id: newId, customer_name: cName, customer_phone: cPhone, amount: finalTotal, paid: 0, created_at: new Date().toISOString() };
      const updCr = [cr, ...credits]; setCredits(updCr); sv(`agam_credits_${user}`, updCr);
    }
    setLastSale(sale); setShowShare(true);
    setCart([]); setCName(""); setCPhone("+91"); setCAddr(""); setDiscount(0); setManualTotal(null); setIsCredit(false); setPayMode("Cash");
  };

  // Credits
  const markCreditPaid = (id, amount) => {
    const u = credits.map(c => c.id === id ? { ...c, paid: Math.min(c.amount, c.paid + amount) } : c);
    setCredits(u); sv(`agam_credits_${user}`, u); showToast("Payment recorded!");
  };
  const totalDue = credits.reduce((a, c) => a + (c.amount - c.paid), 0);

  // Income
  const income = useMemo(() => {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), week = new Date(now - 7 * 864e5), month = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    return sales.reduce((a, s) => { const d = new Date(s.created_at); a.all += s.final_amount; if (d >= today) a.today += s.final_amount; if (d >= week) a.weekly += s.final_amount; if (d >= month) a.monthly += s.final_amount; return a; }, { today: 0, weekly: 0, monthly: 0, all: 0 });
  }, [sales]);

  const chartData = useMemo(() => {
    const now = new Date();
    if (incomeRange === "weekly") return Array.from({ length: 7 }, (_, i) => { const d = new Date(now - (6 - i) * 864e5); const ds = d.toDateString(); return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), amount: sales.filter(x => new Date(x.created_at).toDateString() === ds).reduce((a, x) => a + x.final_amount, 0) }; });
    return Array.from({ length: 6 }, (_, i) => { const end = new Date(now - i * 5 * 864e5), start = new Date(end - 5 * 864e5); return { label: `${start.getDate()}-${end.getDate()}`, amount: sales.filter(x => { const d = new Date(x.created_at); return d > start && d <= end; }).reduce((a, x) => a + x.final_amount, 0) }; }).reverse();
  }, [sales, incomeRange]);
  const maxChart = Math.max(...chartData.map(d => d.amount), 1);

  const filteredSales = useMemo(() => {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), week = new Date(now - 7 * 864e5);
    return sales.filter(x => {
      const t = (x.customer_name || "").toLowerCase().includes(histSearch.toLowerCase()) || (x.customer_phone || "").includes(histSearch);
      if (!t) return false;
      if (histFilter === "today") return new Date(x.created_at) >= today;
      if (histFilter === "week") return new Date(x.created_at) >= week;
      if (histFilter === "credit") return x.is_credit;
      return true;
    });
  }, [sales, histSearch, histFilter]);

  const exportCSV = () => {
    const rows = [["Bill No", "Date", "Customer", "Phone", "Address", "Subtotal", "Discount", "Final", "Payment", "Items"]];
    filteredSales.forEach(x => rows.push([x.id, fmtDate(x.created_at), x.customer_name || "Walk-in", x.customer_phone, x.customer_address || "", x.total_amount, x.discount, x.final_amount, x.payment_mode || "Cash", x.items.map(i => `${i.name}(${i.quantity})`).join("; ")]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv); a.download = `Agam_Sales.csv`; a.click(); showToast("CSV exported!");
  };

  const shareWA = (sale) => {
    const text = `*${settings.shop_name}*\nBill No: #${sale.id}\nCustomer: ${sale.customer_name || "Walk-in"}\nItems: ${sale.items.map(i => `${i.name} ×${i.quantity}`).join(", ")}\nTotal: ₹${sale.final_amount}\n${sale.is_credit ? "⚠️ UDHAR/CREDIT" : `Payment: ${sale.payment_mode}`}\nThank you! 🌿`;
    let ph = (sale.customer_phone || "").replace(/\D/g, ""); if (ph.startsWith("0")) ph = ph.slice(1); if (ph.length === 10) ph = "91" + ph;
    window.open(`https://wa.me/${ph}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const updateSettings = () => { sv(`agam_settings_${user}`, settings); showToast("Settings saved!"); };

  // ── AUTH SCREEN ──
  if (!user) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#1a1a1a" }}>
      <div style={st.phone}>
        <div style={{ ...st.hdr, justifyContent: "center", padding: "50px 20px 30px", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 68, height: 68, background: "rgba(255,255,255,0.15)", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center" }}><Ic d={I.leaf} size={34} color="#fff" /></div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>Agam Nursery</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Billing & Sales Management</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "30px 20px", overflowY: "auto" }}>
          <div style={st.card}>
            <div style={{ fontSize: 20, fontWeight: 700, color: G, marginBottom: 20 }}>{authMode === "login" ? "Welcome Back 👋" : "Create Account"}</div>
            {authErr && <div style={{ background: "#fee2e2", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{authErr}</div>}
            <label style={st.lbl}>Email</label>
            <input style={{ ...st.inp, marginBottom: 14 }} type="email" placeholder="you@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
            <label style={st.lbl}>Password</label>
            <input style={{ ...st.inp, marginBottom: 20 }} type="password" placeholder="••••••••" value={authPass} onChange={e => setAuthPass(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
            <button style={{ ...st.btn("primary"), width: "100%", padding: "14px" }} onClick={handleAuth}>{authMode === "login" ? "Sign In" : "Create Account"}</button>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthErr(""); }} style={{ background: "none", border: "none", color: G, fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif" }}>
                {authMode === "login" ? "New user? Create account" : "Already have account? Sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#111" }}>
      <div style={st.phone}>
        {toast && <Toast msg={toast} onDone={() => setToast("")} />}

        {/* Status bar */}
        <div style={{ background: G, padding: "10px 24px 0", display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "system-ui", flexShrink: 0 }}>
          <span style={{ fontWeight: 700 }}>9:41</span><span>●●● 🔋</span>
        </div>

        {/* Header */}
        <div style={st.hdr}>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}>
            <Ic d={I.menu} size={18} color="#fff" />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ic d={I.leaf} size={18} color="#fff" />
            <span style={{ fontSize: 17, fontWeight: 700 }}>{settings.shop_name}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {lowStock.length > 0 && <button onClick={() => setShowStock(true)} style={{ background: "#ff9800", border: "none", borderRadius: 10, padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#fff", fontFamily: "Georgia,serif", fontWeight: 700 }}>⚠ {lowStock.length}</button>}
            {totalDue > 0 && <button onClick={() => setShowCredits(true)} style={{ background: "#e53935", border: "none", borderRadius: 10, padding: "4px 8px", cursor: "pointer", fontSize: 11, color: "#fff", fontFamily: "Georgia,serif", fontWeight: 700 }}>₹{totalDue}↑</button>}
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, zIndex: 199 }} />
            <div style={{ position: "absolute", top: 108, left: 20, background: "#fff", borderRadius: 18, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 200, minWidth: 210, overflow: "hidden" }}>
              {[["billing", "Billing", I.cart], ["products", "Products", I.pkg], ["history", "History", I.history], ["settings", "Settings", I.sett]].map(([t, lbl, ic]) => (
                <button key={t} onClick={() => { setTab(t); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", background: tab === t ? GL : "#fff", color: tab === t ? G : "#555", fontSize: 14, fontFamily: "Georgia,serif", cursor: "pointer", borderLeft: tab === t ? `3px solid ${G}` : "3px solid transparent" }}>
                  <Ic d={ic} size={16} color={tab === t ? G : "#9aab97"} /> {lbl}
                </button>
              ))}
              <button onClick={() => { setShowCredits(true); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", background: "#fff3e0", color: "#e65100", fontSize: 14, fontFamily: "Georgia,serif", cursor: "pointer", borderLeft: "3px solid #ff9800" }}>
                <Ic d={I.credit} size={16} color="#e65100" /> Udhar / Credit {totalDue > 0 && `(₹${totalDue})`}
              </button>
              <button onClick={() => { setShowStock(true); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "13px 16px", border: "none", background: "#fff", color: "#555", fontSize: 14, fontFamily: "Georgia,serif", cursor: "pointer", borderLeft: "3px solid transparent" }}>
                <Ic d={I.pkg} size={16} color="#9aab97" /> Stock Manager
              </button>
              <div style={{ borderTop: "1px solid #eee" }}>
                <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", border: "none", background: "none", color: "#dc2626", fontSize: 13, fontFamily: "Georgia,serif", cursor: "pointer" }}>
                  Logout ({user})
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px" }}>

          {/* ══ BILLING ══ */}
          {tab === "billing" && (
            <BillingTab
              products={products} cart={cart} addToCart={addToCart} updateQty={updateQty} removeFromCart={removeFromCart}
              cName={cName} setCName={setCName} cPhone={cPhone} setCPhone={setCPhone} cAddr={cAddr} setCAddr={setCAddr}
              discount={discount} setDiscount={setDiscount} manualTotal={manualTotal} setManualTotal={setManualTotal}
              payMode={payMode} setPayMode={setPayMode} isCredit={isCredit} setIsCredit={setIsCredit}
              showItemDisc={showItemDisc} setShowItemDisc={setShowItemDisc}
              generateBill={generateBill} subtotal={subtotal} itemDiscTotal={itemDiscTotal} finalTotal={finalTotal}
              searchQ={searchQ} setSearchQ={setSearchQ}
            />
          )}

          {/* ══ PRODUCTS ══ */}
          {tab === "products" && (
            <div>
              <div style={st.card}>
                <div style={{ fontSize: 16, fontWeight: 700, color: G, marginBottom: 14 }}>{editProd ? "✏️ Edit Product" : "Add New Product"}</div>
                <label style={st.lbl}>Product Name *</label>
                <input style={{ ...st.inp, marginBottom: 10 }} placeholder="e.g. Aloe Vera" value={pName} onChange={e => setPName(e.target.value)} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><label style={st.lbl}>Price (₹) *</label><input style={st.inp} type="number" placeholder="0.00" value={pPrice} onChange={e => setPPrice(e.target.value)} /></div>
                  <div><label style={st.lbl}>Category</label><input style={st.inp} placeholder="Indoor / Outdoor" value={pCat} onChange={e => setPCat(e.target.value)} /></div>
                </div>
                <div style={{ marginBottom: 14 }}><label style={st.lbl}>Stock (optional, leave blank to skip)</label><input style={st.inp} type="number" placeholder="e.g. 50" value={pStock} onChange={e => setPStock(e.target.value)} /></div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={saveProduct} style={{ ...st.btn("primary"), flex: 1 }}><Ic d={editProd ? I.check : I.plus} size={18} color="#fff" />{editProd ? "Update" : "Add"}</button>
                  {editProd && <button onClick={() => { setEditProd(null); setPName(""); setPPrice(""); setPCat(""); setPStock(""); }} style={{ ...st.btn("ghost"), flex: 1 }}>Cancel</button>}
                </div>
              </div>
              {products.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#9aab97" }}>No products yet.</div>}
              {products.map(p => (
                <div key={p.id} style={{ ...st.card, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, background: GL, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic d={I.leaf} size={20} color={G} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "#9aab97" }}>{p.category || "General"} · ₹{p.price}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => startEdit(p)} style={{ background: GL, border: "none", borderRadius: 10, padding: "8px", cursor: "pointer" }}><Ic d={I.edit} size={15} color={G} /></button>
                      <button onClick={() => delProduct(p.id)} style={{ ...st.btn("danger"), padding: "8px", borderRadius: 10 }}><Ic d={I.trash} size={15} color="#dc2626" /></button>
                    </div>
                  </div>
                  {p.stock != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, borderTop: "1px solid #f0f4ef", paddingTop: 10 }}>
                      <span style={{ fontSize: 12, color: p.stock <= 5 ? "#dc2626" : "#9aab97", fontWeight: 700, flex: 1 }}>Stock: {p.stock} units{p.stock <= 5 ? " ⚠️" : ""}</span>
                      <button onClick={() => updateStock(p.id, -1)} style={{ width: 28, height: 28, border: `1px solid ${GL}`, borderRadius: 8, background: GL, cursor: "pointer", fontWeight: 700, color: G, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <button onClick={() => updateStock(p.id, 1)} style={{ width: 28, height: 28, border: `1px solid ${GL}`, borderRadius: 8, background: GL, cursor: "pointer", fontWeight: 700, color: G, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ══ HISTORY ══ */}
          {tab === "history" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["Today", income.today], ["This Week", income.weekly]].map(([l, v]) => (
                  <div key={l} style={{ background: G, borderRadius: 16, padding: "14px 16px" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>₹{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <Ic d={I.search} size={16} color="#9aab97" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input style={{ ...st.inp, paddingLeft: 36 }} placeholder="Search..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
                </div>
                <button onClick={() => setShowIncome(true)} style={{ ...st.btn("ghost"), padding: "0 12px", borderRadius: 10 }}><Ic d={I.trend} size={16} color={G} /></button>
                <button onClick={exportCSV} style={{ ...st.btn("ghost"), padding: "0 12px", borderRadius: 10 }}><Ic d={I.pdf} size={16} color={G} /></button>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto" }}>
                {[["all", "All"], ["today", "Today"], ["week", "Week"], ["credit", "Udhar"]].map(([f, l]) => (
                  <button key={f} onClick={() => setHistFilter(f)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: "none", background: histFilter === f ? G : GL, color: histFilter === f ? "#fff" : G, fontSize: 12, fontFamily: "Georgia,serif", fontWeight: 700, cursor: "pointer" }}>{l}</button>
                ))}
              </div>
              {filteredSales.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#9aab97" }}>No sales found.</div>}
              {filteredSales.map(sale => (
                <div key={sale.id} onClick={() => { setSelSale(sale); setShowDetail(true); }} style={{ ...st.card, cursor: "pointer", borderLeft: `4px solid ${sale.is_credit ? "#ff9800" : G}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{sale.customer_name || "Walk-in"}</div>
                      <div style={{ fontSize: 12, color: "#9aab97", marginTop: 2 }}>{sale.customer_phone} · {fmtDate(sale.created_at)}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        <span style={{ background: GL, color: G, fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{sale.payment_mode || "Cash"}</span>
                        {sale.is_credit && <span style={{ background: "#fff3e0", color: "#e65100", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>UDHAR</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: G }}>₹{sale.final_amount}</div>
                      <div style={{ fontSize: 11, color: "#9aab97" }}>#{sale.id}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); shareWA(sale); }} style={{ ...st.btn("ghost"), flex: 1, padding: "8px", fontSize: 13, borderRadius: 10 }}><Ic d={I.wa} size={15} color={G} /> WhatsApp</button>
                    <button onClick={e => { e.stopPropagation(); generateBillPDF(sale, settings).then(() => showToast("PDF downloaded!")); }} style={{ ...st.btn("ghost"), flex: 1, padding: "8px", fontSize: 13, borderRadius: 10 }}><Ic d={I.pdf} size={15} color={G} /> PDF</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab === "settings" && (
            <div>
              <div style={st.card}>
                <div style={{ fontSize: 16, fontWeight: 700, color: G, marginBottom: 16 }}>🏪 Shop Details</div>
                {[["Shop Name", "shop_name", "text", "Agam Nursery"], ["Address", "address", "text", "Shop address"], ["Phone", "phone", "tel", "+91..."], ["Email", "email", "email", "email@shop.com"], ["GST Number", "gst_number", "text", "Optional"]].map(([lbl, key, type, ph]) => (
                  <div key={key} style={{ marginBottom: 14 }}>
                    <label style={st.lbl}>{lbl}</label>
                    <input style={st.inp} type={type} placeholder={ph} value={settings[key] || ""} onChange={e => setSettings({ ...settings, [key]: e.target.value })} />
                  </div>
                ))}
                <button onClick={updateSettings} style={{ ...st.btn("primary"), width: "100%" }}><Ic d={I.check} size={18} color="#fff" /> Save Settings</button>
              </div>
              <div style={st.card}>
                <div style={{ fontSize: 15, fontWeight: 700, color: G, marginBottom: 14 }}>📊 App Stats</div>
                {[["Total Bills", sales.length], ["Total Products", products.length], ["Pending Credits", `₹${totalDue}`], ["All Time Revenue", `₹${income.all}`]].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f4ef", fontSize: 14 }}>
                    <span style={{ color: "#9aab97" }}>{lbl}</span><span style={{ fontWeight: 700, color: G }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={st.card}>
                <div style={{ fontSize: 14, color: "#9aab97", marginBottom: 12 }}>Logged in as: {user}</div>
                <button onClick={logout} style={{ ...st.btn("danger"), width: "100%" }}>Logout</button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={st.nav}>
          {[["billing", "Billing", I.cart], ["products", "Products", I.pkg], ["history", "History", I.history], ["settings", "Settings", I.sett]].map(([t, lbl, ic]) => (
            <button key={t} onClick={() => setTab(t)} style={st.nb(tab === t)}><Ic d={ic} size={20} /><span>{lbl}</span></button>
          ))}
        </div>

        {/* ── SHARE MODAL ── */}
        {showShare && lastSale && (
          <div style={st.ov} onClick={() => setShowShare(false)}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: G }}>Bill Ready! 🎉</div>
                <button onClick={() => setShowShare(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Ic d={I.x} size={18} /></button>
              </div>
              <div style={{ background: GL, borderRadius: 16, padding: 16, marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: "#5a7057", marginBottom: 4 }}>Bill Amount</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: G }}>₹{lastSale.final_amount}</div>
                <div style={{ fontSize: 12, color: "#9aab97", marginTop: 4 }}>#{lastSale.id} · {lastSale.customer_name || "Walk-in"} · {lastSale.payment_mode}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <button onClick={() => { generateBillPDF(lastSale, settings).then(() => showToast("PDF downloaded!")); setShowShare(false); }}
                  style={{ ...st.btn("ghost"), padding: "14px 8px", flexDirection: "column", gap: 6, borderRadius: 16, height: 80, border: "1px solid #e2f0e0" }}>
                  <Ic d={I.pdf} size={24} color={G} /><span style={{ fontSize: 12 }}>Download PDF</span>
                </button>
                <button onClick={() => shareWA(lastSale)} style={{ ...st.btn("ghost"), padding: "14px 8px", flexDirection: "column", gap: 6, borderRadius: 16, height: 80, border: "1px solid #e2f0e0" }}>
                  <Ic d={I.wa} size={24} color={G} /><span style={{ fontSize: 12 }}>WhatsApp</span>
                </button>
                <button onClick={() => window.print()} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 16, padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", height: 80 }}>
                  <Ic d={I.pdf} size={24} color="#fff" /><span style={{ fontSize: 12, fontFamily: "Georgia,serif" }}>Print</span>
                </button>
              </div>
              <button onClick={() => setShowShare(false)} style={{ width: "100%", marginTop: 16, background: "none", border: "none", color: "#9aab97", fontSize: 14, cursor: "pointer", fontFamily: "Georgia,serif", padding: "10px" }}>Close</button>
            </div>
          </div>
        )}

        {/* ── ITEM DISCOUNT MODAL ── */}
        {showItemDisc && (
          <div style={st.ov} onClick={() => setShowItemDisc(false)}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: G }}>Per-Item Discounts</div>
                <button onClick={() => setShowItemDisc(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Ic d={I.x} size={18} /></button>
              </div>
              {cart.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f4ef" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#9aab97" }}>₹{item.price} × {item.quantity}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 13, color: "#9aab97" }}>₹</span>
                    <input type="number" value={item.discount || ""} placeholder="0" onChange={e => updateItemDisc(item.id, parseFloat(e.target.value) || 0)}
                      style={{ ...st.inp, width: 60, textAlign: "right", padding: "6px 8px" }} />
                    <span style={{ fontSize: 12, color: "#9aab97" }}>/unit</span>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowItemDisc(false)} style={{ ...st.btn("primary"), width: "100%", marginTop: 16 }}><Ic d={I.check} size={18} color="#fff" /> Done</button>
            </div>
          </div>
        )}

        {/* ── BILL DETAIL MODAL ── */}
        {showDetail && selSale && (
          <div style={st.ov} onClick={() => setShowDetail(false)}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div><div style={{ fontSize: 18, fontWeight: 700, color: G }}>Bill #{selSale.id}</div><div style={{ fontSize: 12, color: "#9aab97" }}>{fmtDate(selSale.created_at)}</div></div>
                <button onClick={() => setShowDetail(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Ic d={I.x} size={18} /></button>
              </div>
              <div style={{ background: GL, borderRadius: 14, padding: 14, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selSale.customer_name || "Walk-in"}</div>
                <div style={{ fontSize: 13, color: "#5a7057", marginTop: 2 }}>{selSale.customer_phone}</div>
                {selSale.customer_address && <div style={{ fontSize: 12, color: "#9aab97", marginTop: 2 }}>{selSale.customer_address}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <span style={{ background: "#fff", color: G, fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 700 }}>{selSale.payment_mode || "Cash"}</span>
                  {selSale.is_credit && <span style={{ background: "#fff3e0", color: "#e65100", fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 700 }}>UDHAR</span>}
                </div>
              </div>
              {selSale.items.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f4ef", fontSize: 14 }}>
                  <div><span style={{ fontWeight: 600 }}>{item.name}</span><span style={{ color: "#9aab97", fontSize: 12 }}> × {item.quantity}</span></div>
                  <span style={{ fontWeight: 700 }}>₹{item.total}</span>
                </div>
              ))}
              <div style={{ background: GL, borderRadius: 14, padding: 14, marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#5a7057" }}>Subtotal</span><span>₹{selSale.total_amount}</span></div>
                {selSale.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}><span style={{ color: "#5a7057" }}>Discount</span><span style={{ color: "#dc2626" }}>-₹{selSale.discount}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 18, borderTop: `1px solid ${G}30`, paddingTop: 10 }}>
                  <span style={{ color: G }}>Total</span><span style={{ color: G }}>₹{selSale.final_amount}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                <button onClick={() => { generateBillPDF(selSale, settings).then(() => { showToast("PDF downloaded!"); setShowDetail(false); }); }} style={{ ...st.btn("ghost"), padding: "12px", borderRadius: 12, border: "1px solid #e2f0e0" }}>
                  <Ic d={I.pdf} size={18} color={G} /> Download PDF
                </button>
                <button onClick={() => { shareWA(selSale); setShowDetail(false); }} style={{ ...st.btn("primary"), padding: "12px", borderRadius: 12 }}>
                  <Ic d={I.wa} size={18} color="#fff" /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── INCOME MODAL ── */}
        {showIncome && (
          <div style={st.ov} onClick={() => setShowIncome(false)}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: G }}>📊 Income Analysis</div>
                <button onClick={() => setShowIncome(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Ic d={I.x} size={18} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                {[["Today", income.today, false], ["Weekly", income.weekly, false], ["Monthly", income.monthly, false], ["All Time", income.all, true]].map(([l, v, dark]) => (
                  <div key={l} style={{ background: dark ? G : GL, borderRadius: 16, padding: "14px" }}>
                    <div style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.7)" : "#9aab97", marginBottom: 4, fontWeight: 700, textTransform: "uppercase" }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: dark ? "#fff" : G }}>₹{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["weekly", "monthly"].map(r => (
                  <button key={r} onClick={() => setIncomeRange(r)} style={{ flex: 1, padding: "8px", border: "none", borderRadius: 10, background: incomeRange === r ? G : GL, color: incomeRange === r ? "#fff" : G, fontFamily: "Georgia,serif", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{r}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 120, marginBottom: 6 }}>
                {chartData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, color: "#9aab97" }}>{d.amount > 0 ? `₹${d.amount}` : ""}</div>
                    <div style={{ width: "100%", background: d.amount > 0 ? G : GL, borderRadius: 6, height: Math.max(4, (d.amount / maxChart) * 90), transition: "height 0.3s" }} />
                    <span style={{ fontSize: 9, color: "#9aab97" }}>{d.label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowIncome(false)} style={{ ...st.btn("primary"), width: "100%", marginTop: 12 }}>Close</button>
            </div>
          </div>
        )}

        {/* ── UDHAR / CREDITS MODAL ── */}
        {showCredits && (
          <div style={st.ov} onClick={() => setShowCredits(false)}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#e65100" }}>💰 Udhar / Credit</div>
                  <div style={{ fontSize: 12, color: "#9aab97" }}>Total pending: ₹{totalDue}</div>
                </div>
                <button onClick={() => setShowCredits(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Ic d={I.x} size={18} /></button>
              </div>
              {credits.filter(c => c.amount - c.paid > 0).length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: "#9aab97" }}>No pending credits! 🎉</div>}
              {credits.filter(c => c.amount - c.paid > 0).map(cr => (
                <CreditItem key={cr.id} cr={cr}
                  onPaid={(id, amt) => markCreditPaid(id, amt)}
                  onWA={(cr) => shareWA({ ...cr, id: cr.sale_id, final_amount: cr.amount - cr.paid, items: [], payment_mode: "Credit", is_credit: true })}
                />
              ))}
              <button onClick={() => setShowCredits(false)} style={{ ...st.btn("primary"), width: "100%", marginTop: 8 }}>Close</button>
            </div>
          </div>
        )}

        {/* ── STOCK MANAGER MODAL ── */}
        {showStock && (
          <div style={st.ov} onClick={() => setShowStock(false)}>
            <div style={st.modal} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: G }}>📦 Stock Manager</div>
                  {lowStock.length > 0 && <div style={{ fontSize: 12, color: "#dc2626" }}>⚠️ {lowStock.length} items low on stock</div>}
                </div>
                <button onClick={() => setShowStock(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 10, padding: 8, cursor: "pointer" }}><Ic d={I.x} size={18} /></button>
              </div>
              {products.filter(p => p.stock != null).length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#9aab97", fontSize: 14 }}>No stock tracking enabled.<br />Add stock in Products tab.</div>}
              {products.filter(p => p.stock != null).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0f4ef" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#9aab97" }}>{p.category || "General"} · ₹{p.price}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => updateStock(p.id, -1)} style={{ width: 30, height: 30, border: `1px solid ${GL}`, borderRadius: 8, background: GL, cursor: "pointer", fontWeight: 700, color: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 36, textAlign: "center", color: p.stock <= 5 ? "#dc2626" : "#2d3a2b", fontSize: 16 }}>{p.stock}</span>
                    <button onClick={() => updateStock(p.id, 1)} style={{ width: 30, height: 30, border: `1px solid ${GL}`, borderRadius: 8, background: GL, cursor: "pointer", fontWeight: 700, color: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</button>
                  </div>
                  <span style={{ fontSize: 18 }}>{p.stock <= 0 ? "🚫" : p.stock <= 5 ? "⚠️" : "✅"}</span>
                </div>
              ))}
              <button onClick={() => setShowStock(false)} style={{ ...st.btn("primary"), width: "100%", marginTop: 16 }}>Close</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
