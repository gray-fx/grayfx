import { useState } from "react";

type ShootStatus = "Upcoming" | "Awaiting Edits" | "Editing" | "Completed";

type Row = {
  name: string;
  status: ShootStatus;
  rawDate?: string;
  link?: string;
};

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StatusUpdate() {
  const [rows, setRows] = useState<Row[]>([]);
  const [importText, setImportText] = useState("");
  const [generated, setGenerated] = useState("");

  function addRow() {
    setRows([
      ...rows,
      {
        name: "",
        status: "Upcoming",
        rawDate: "",
        link: "",
      },
    ]);
  }

  function updateRow(index: number, field: keyof Row, value: any) {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const updated = [...rows];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setRows(updated);
  }

  function moveDown(index: number) {
    if (index === rows.length - 1) return;
    const updated = [...rows];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    setRows(updated);
  }

  function deleteRow(index: number) {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  }

  function generateCode() {
    const outputLines: string[] = [];
    outputLines.push(`export type ShootStatus = "Upcoming" | "Awaiting Edits" | "Editing" | "Completed";`);
    outputLines.push("");
    outputLines.push("export interface Photoshoot {");
    outputLines.push("  name: string;");
    outputLines.push("  status: ShootStatus;");
    outputLines.push("  date?: string;");
    outputLines.push("  link?: string;");
    outputLines.push("}");
    outputLines.push("");
    outputLines.push("export const photoshoots: Photoshoot[] = [");

    rows.forEach((row) => {
      const date = formatDate(row.rawDate);
      const objLines = [
        "  {",
        `    name: "${row.name}",`,
        `    status: "${row.status}",`,
      ];
      if (date) objLines.push(`    date: "${date}",`);
      if (row.link) objLines.push(`    link: "${row.link}",`);
      // Remove trailing comma on last property
      objLines[objLines.length - 1] = objLines[objLines.length - 1].replace(/,$/, "");
      objLines.push("  },");
      outputLines.push(...objLines);
    });

    // Remove trailing comma on last array item
    if (outputLines[outputLines.length - 1].trim() === "},") {
      outputLines[outputLines.length - 1] = "  }";
    }

    outputLines.push("];");
    outputLines.push("");
    outputLines.push("export default photoshoots;");

    setGenerated(outputLines.join("\n"));
  }

  function copyOutput() {
    navigator.clipboard.writeText(generated);
  }

  function importCode() {
    try {
      const matches = importText.match(/\{[^}]+\}/g);
      if (!matches) return;

      const newRows = matches.map((obj) => {
        const name = obj.match(/name:\s*"([^"]+)"/)?.[1] || "";
        const status = (obj.match(/status:\s*"([^"]+)"/)?.[1] as ShootStatus) || "Upcoming";
        const date = obj.match(/date:\s*"([^"]+)"/)?.[1] || "";
        const link = obj.match(/link:\s*"([^"]+)"/)?.[1] || "";

        let rawDate = "";
        if (date) {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) rawDate = parsed.toISOString().split("T")[0];
        }

        return { name, status, rawDate, link };
      });

      setRows(newRows);
    } catch (e) {
      console.error("Import failed", e);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Status Update Tool</h1>

      <div>
        <p className="text-sm mb-2">Import Existing Source Code</p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste photoshoots.ts here..."
          className="w-full h-40 bg-black/60 border border-border p-3 rounded font-mono text-sm"
        />
        <button onClick={importCode} className="mt-2 px-4 py-2 border border-primary rounded">
          Import
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-7 gap-2 items-center">
            <input
              value={row.name}
              onChange={(e) => updateRow(i, "name", e.target.value)}
              placeholder="Name"
              className="bg-black/60 border border-border px-2 py-1 rounded"
            />

            <select
              value={row.status}
              onChange={(e) => updateRow(i, "status", e.target.value as ShootStatus)}
              className="bg-black/60 border border-border px-2 py-1 rounded"
            >
              <option>Upcoming</option>
              <option>Awaiting Edits</option>
              <option>Editing</option>
              <option>Completed</option>
            </select>

            <input
              type="date"
              value={row.rawDate || ""}
              onChange={(e) => updateRow(i, "rawDate", e.target.value)}
              className="bg-black/60 border border-border px-2 py-1 rounded"
            />

            <input
              value={row.link || ""}
              onChange={(e) => updateRow(i, "link", e.target.value)}
              placeholder="Gallery Link"
              className="bg-black/60 border border-border px-2 py-1 rounded"
            />

            <div className="flex gap-2">
              <button onClick={() => moveUp(i)} className="px-2 border rounded">
                ↑
              </button>
              <button onClick={() => moveDown(i)} className="px-2 border rounded">
                ↓
              </button>
              <button onClick={() => deleteRow(i)} className="px-2 border rounded text-red-500">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={addRow} className="px-4 py-2 border border-primary rounded">
          Add Row
        </button>
        <button onClick={generateCode} className="px-4 py-2 border border-green-500 rounded">
          Generate Code
        </button>
      </div>

      {generated && (
        <div className="space-y-2">
          <p className="text-sm">Generated Output</p>
          <textarea
            value={generated}
            readOnly
            className="w-full h-64 bg-black/70 border border-border p-3 rounded font-mono text-sm"
          />
          <button onClick={copyOutput} className="px-4 py-2 border border-primary rounded">
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
