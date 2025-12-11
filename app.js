// app.js — JSX + React (works on Vercel with Babel standalone)

const STORAGE_KEY = "my_personal_expenses_v1";

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {          // FIXED
    return [];
  }
}

function saveExpenses(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}         // FIXED
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Entertainment",
  "Income",
  "Other"
];

function App() {
  const [expenses, setExpenses] = React.useState(loadExpenses());
  const [filterCategory, setFilterCategory] = React.useState("All");
  const [searchText, setSearchText] = React.useState("");
  const [editing, setEditing] = React.useState(null);

  React.useEffect(() => saveExpenses(expenses), [expenses]);

  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((s, e) => s + Number(e.amount), 0);

  const totalExpense = expenses
    .filter((e) => e.type === "expense")
    .reduce((s, e) => s + Number(e.amount), 0);

  const balance = totalIncome - totalExpense;

  function addExpense(item) {
    const id = Date.now().toString();
    setExpenses((prev) => [{ ...item, id }, ...prev]);
  }

  function updateExpense(id, item) {
    setExpenses((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...item } : p))
    );
    setEditing(null);
  }

  function deleteExpense(id) {
    if (!confirm("Delete this entry?")) return;
    setExpenses((prev) => prev.filter((p) => p.id !== id));
  }

  function clearAll() {
    if (!confirm("Clear all saved data?")) return;
    setExpenses([]);
  }

  const filtered = expenses.filter((e) => {
    if (filterCategory !== "All" && e.category !== filterCategory) return false;
    if (searchText && !e.title.toLowerCase().includes(searchText.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="container">
      <div className="header">
        <h1>Personal Expense Tracker</h1>

        <button
          className="muted-btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(expenses, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "expenses.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export
        </button>
      </div>

      <div className="layout">
        
        {/* LEFT SIDE */}
        <div>
          <div className="card">
            <AddEditForm
              categories={CATEGORIES}
              onAdd={addExpense}
              onUpdate={updateExpense}
              editing={editing}
              onCancel={() => setEditing(null)}
            />
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <strong>Summary</strong>
            <div className="summary">
              <div className="item card">
                <div className="small">Income</div>
                <div className="green">₹{totalIncome}</div>
              </div>
              <div className="item card">
                <div className="small">Expense</div>
                <div className="red">₹{totalExpense}</div>
              </div>
              <div className="item card">
                <div className="small">Balance</div>
                <div>₹{balance}</div>
              </div>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option>All</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <input
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <button className="muted-btn" onClick={() => {
              setFilterCategory("All");
              setSearchText("");
            }}>
              Reset
            </button>

            <button className="muted-btn" onClick={clearAll}>
              Clear All
            </button>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <strong>Transactions</strong>

            {filtered.length === 0 ? (
              <div className="empty">No records found</div>
            ) : (
              <ul className="expenses">
                {filtered.map((item) => (
                  <li className="row" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <div className="small">
                        {item.category} •{" "}
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className={item.type === "income" ? "green" : "red"}>
                        {item.type === "income" ? "+" : "-"}₹{item.amount}
                      </div>

                      <div className="actions">
                        <button
                          className="muted-btn"
                          onClick={() => setEditing(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="muted-btn"
                          onClick={() => deleteExpense(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <div className="card">
            <strong>Category Breakdown</strong>
            <ChartWidget items={expenses} categories={CATEGORIES} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEditForm({ categories, onAdd, onUpdate, editing, onCancel }) {
  const defaultForm = {
    title: "",
    amount: "",
    category: categories[0],
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
  };

  const [form, setForm] = React.useState(defaultForm);

  React.useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        amount: editing.amount,
        category: editing.category,
        date: editing.date.slice(0, 10),
        type: editing.type,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editing]);

  function submit(e) {
    e.preventDefault();

    if (!form.title || !form.amount) return alert("Required fields missing");

    const payload = {
      ...form,
      amount: Number(form.amount),
      date: new Date(form.date).toISOString(),
    };

    if (editing) onUpdate(editing.id, payload);
    else onAdd(payload);

    setForm(defaultForm);
  }

  return (
    <form onSubmit={submit}>
      <strong>{editing ? "Edit Entry" : "Add Entry"}</strong>

      <label>Title</label>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <label>Amount</label>
      <input
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />

      <label>Category</label>
      <select
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <label>Type</label>
      <select
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      <label>Date</label>
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <div style={{ marginTop: 8 }}>
        <button className="btn" type="submit">
          {editing ? "Save Changes" : "Add Entry"}
        </button>
        {editing && (
          <button
            type="button"
            className="muted-btn"
            onClick={onCancel}
            style={{ marginLeft: 6 }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ChartWidget({ items, categories }) {
  const canvasRef = React.useRef();
  const chartRef = React.useRef();

  React.useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) chartRef.current.destroy();

    const totals = categories.map((cat) =>
      items
        .filter((i) => i.category === cat && i.type === "expense")
        .reduce((s, i) => s + Number(i.amount), 0)
    );

    chartRef.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: categories,
        datasets: [{ data: totals }],
      },
      options: { plugins: { legend: { position: "right" } } },
    });

    return () => chartRef.current && chartRef.current.destroy();
  }, [items]);

  return (
    <div style={{ height: 300 }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
