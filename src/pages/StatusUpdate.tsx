import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Copy, Plus, Upload } from "lucide-react";

type ShootStatus = "Not Shot" | "Awaiting Edits" | "Editing" | "Completed";

interface Row {
  name: string;
  status: ShootStatus;
  date: string;
  link: string;
}

const statuses: ShootStatus[] = [
  "Not Shot",
  "Awaiting Edits",
  "Editing",
  "Completed",
];

const StatusUpdate = () => {

  const [rows, setRows] = useState<Row[]>([
    { name: "", status: "Not Shot", date: "", link: "" },
  ]);

  const [output, setOutput] = useState("");
  const [importText, setImportText] = useState("");

  const addRow = () => {
    setRows([...rows, { name: "", status: "Not Shot", date: "", link: "" }]);
  };

  const removeRow = (i: number) => {
    setRows(rows.filter((_, index) => index !== i));
  };

  const moveUp = (i: number) => {
    if (i === 0) return;

    const newRows = [...rows];
    [newRows[i - 1], newRows[i]] = [newRows[i], newRows[i - 1]];
    setRows(newRows);
  };

  const moveDown = (i: number) => {
    if (i === rows.length - 1) return;

    const newRows = [...rows];
    [newRows[i + 1], newRows[i]] = [newRows[i], newRows[i + 1]];
    setRows(newRows);
  };

  const update = (i: number, key: keyof Row, value: string) => {
    const newRows = [...rows];
    newRows[i] = { ...newRows[i], [key]: value };
    setRows(newRows);
  };

  const generate = () => {

    const shoots = rows
      .filter((r) => r.name)
      .map((r) => {

        let obj = `{ name: "${r.name}", status: "${r.status}"`;

        if (r.date) obj += `, date: "${r.date}"`;
        if (r.link) obj += `, link: "${r.link}"`;

        obj += " }";

        return obj;

      });

    const code = `// =============================================
 // Edit this file to update photoshoot statuses!
 // =============================================

export type ShootStatus = "Not Shot" | "Awaiting Edits" | "Editing" | "Completed";

export interface Photoshoot {
  name: string;
  status: ShootStatus;
  date?: string;
  link?: string;
}

const photoshoots: Photoshoot[] = [
  ${shoots.join(",\n  ")}
];

export default photoshoots;
`;

    setOutput(code);

  };

  const copy = () => {
    navigator.clipboard.writeText(output);
  };

  const importCode = () => {

    try {

      const matches = importText.match(/\{[^}]+\}/g);

      if (!matches) return;

      const newRows = matches.map((obj) => {

        const name = obj.match(/name:\s*"([^"]+)"/)?.[1] || "";
        const status = obj.match(/status:\s*"([^"]+)"/)?.[1] || "Not Shot";
        const date = obj.match(/date:\s*"([^"]+)"/)?.[1] || "";
        const link = obj.match(/link:\s*"([^"]+)"/)?.[1] || "";

        return {
          name,
          status: status as ShootStatus,
          date,
          link,
        };

      });

      setRows(newRows);

    } catch {
      console.error("Import failed");
    }

  };

  return (
    <div className="min-h-screen bg-background px-6 py-24">

      <div className="mx-auto max-w-5xl">

        <h1 className="font-display text-4xl font-bold text-center text-foreground">
          Photoshoot Status Editor
        </h1>

        {/* IMPORT BOX */}

        <div className="mt-12">

          <p className="text-sm text-muted-foreground mb-2">
            Import Existing Photoshoots
          </p>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your current photoshoots.ts file here..."
            className="w-full h-40 bg-black/60 border border-border p-4 font-mono text-green-400 rounded"
          />

          <button
            onClick={importCode}
            className="mt-3 flex items-center gap-2 border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-primary-foreground transition"
          >
            <Upload size={16} /> Import
          </button>

        </div>

        {/* TABLE */}

        <div className="mt-12 rounded-lg border border-border bg-card p-6">

          <table className="w-full text-sm">

            <thead className="text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="text-left pb-3">Name</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-left pb-3">Date</th>
                <th className="text-left pb-3">Link</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {rows.map((row, i) => (

                <tr key={i} className="border-t border-border">

                  <td className="py-2">
                    <input
                      value={row.name}
                      onChange={(e) => update(i, "name", e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded px-2 py-1"
                    />
                  </td>

                  <td>
                    <select
                      value={row.status}
                      onChange={(e) =>
                        update(i, "status", e.target.value as ShootStatus)
                      }
                      className="bg-secondary/50 border border-border rounded px-2 py-1"
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      value={row.date}
                      onChange={(e) => update(i, "date", e.target.value)}
                      className="bg-secondary/50 border border-border rounded px-2 py-1"
                    />
                  </td>

                  <td>
                    <input
                      value={row.link}
                      onChange={(e) => update(i, "link", e.target.value)}
                      className="bg-secondary/50 border border-border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="flex gap-2 py-2">

                    <button
                      onClick={() => moveUp(i)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ArrowUp size={16} />
                    </button>

                    <button
                      onClick={() => moveDown(i)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ArrowDown size={16} />
                    </button>

                    <button
                      onClick={() => removeRow(i)}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          {/* BUTTONS */}

          <div className="flex gap-4 mt-6">

            <button
              onClick={addRow}
              className="flex items-center gap-2 border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-primary-foreground transition"
            >
              <Plus size={16} /> Add Shoot
            </button>

            <button
              onClick={generate}
              className="border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-primary-foreground transition"
            >
              Generate Code
            </button>

            <button
              onClick={copy}
              className="flex items-center gap-2 border border-border px-4 py-2 hover:border-primary hover:text-primary transition"
            >
              <Copy size={16} /> Copy
            </button>

          </div>

          {/* OUTPUT */}

          <textarea
            value={output}
            readOnly
            className="mt-6 w-full h-80 bg-black/60 border border-border p-4 font-mono text-green-400 rounded"
          />

        </div>

      </div>

    </div>
  );
};

export default StatusUpdate;
