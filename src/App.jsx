import { useState, useEffect } from "react";
import ReactFlow from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";

const initialNodes = [
  {
    id: "1",
    position: { x: 100, y: 150 },
    data: { label: "📝 Input" },
    style: {
      background: "#1e293b",
      color: "white",
      padding: 10,
      borderRadius: 10,
      border: "1px solid #334155",
    },
  },
  {
    id: "2",
    position: { x: 500, y: 150 },
    data: { label: "🤖 Result will appear here" },
    style: {
      background: "#1e293b",
      color: "white",
      padding: 10,
      borderRadius: 10,
      border: "1px solid #334155",
      width: 450,
    },
  },
];

const edgesInit = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
  },
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

  const run = async () => {
    try {
      setLoading(true);

      // 🔥 Show thinking in node
      setNodes((prev) =>
        prev.map((n) =>
          n.id === "2"
            ? { ...n, data: { label: "⏳ Thinking..." } }
            : n
        )
      );

      const res = await axios.post(
        "http://localhost:5000/api/ask-ai",
        { prompt }
      );

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id === "1") {
            return { ...n, data: { label: prompt } };
          }
          if (n.id === "2") {
            return { ...n, data: { label: res.data.result } };
          }
          return n;
        })
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);

      await axios.post("http://localhost:5000/api/save", {
        prompt,
        response: nodes.find((n) => n.id === "2")?.data?.label,
      });

      alert("Saved successfully ✅");
    } catch (err) {
      console.log(err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/history");
      setHistory(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const loadHistory = (item) => {
    setPrompt(item.prompt);

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === "1") {
          return { ...n, data: { label: item.prompt } };
        }
        if (n.id === "2") {
          return { ...n, data: { label: item.response } };
        }
        return n;
      })
    );
  };

  return (
    <div className="h-screen flex bg-slate-950 text-white overflow-hidden">

      {/* MOBILE SIDEBAR */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-slate-900 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">History</h2>

            {history.map((item, index) => (
              <div
                key={index}
                onClick={() => {
                  loadHistory(item);
                  setShowSidebar(false);
                }}
                className="p-2 mb-2 bg-slate-800 rounded cursor-pointer hover:bg-slate-700"
              >
                {item.prompt}
              </div>
            ))}
          </div>

          <div
            className="flex-1 bg-black/50"
            onClick={() => setShowSidebar(false)}
          />
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block w-64 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">History</h2>

        {history.map((item, index) => (
          <div
            key={index}
            onClick={() => loadHistory(item)}
            className="p-2 mb-2 bg-slate-800 rounded cursor-pointer hover:bg-slate-700 truncate"
          >
            {item.prompt}
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="p-3 md:p-4 border-b border-slate-800 flex flex-col md:flex-row gap-2 items-center">

          <button
            className="md:hidden bg-slate-800 px-3 py-2 rounded"
            onClick={() => setShowSidebar(true)}
          >
            ☰
          </button>

          <input
            className="bg-slate-800 px-3 py-2 rounded-md border border-slate-700 outline-none w-full md:w-96"
            placeholder="Ask something..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div className="flex gap-2 w-full md:w-auto">

            {/* 🔥 RUN BUTTON WITH LOADER */}
            <button
              onClick={run}
              disabled={loading}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md flex items-center justify-center gap-2
              ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"}`}
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {loading ? "Running..." : "Run"}
            </button>

            {/* 🔥 SAVE BUTTON WITH LOADER */}
            <button
              onClick={saveData}
              disabled={saving}
              className={`flex-1 md:flex-none px-4 py-2 rounded-md flex items-center justify-center gap-2
              ${saving ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}
            >
              {saving && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {saving ? "Saving..." : "Save"}
            </button>

          </div>
        </div>

        {/* FLOW */}
        <div className="flex-1 relative">
          <ReactFlow nodes={nodes} edges={edgesInit} fitView />
        </div>

      </div>
    </div>
  );
}