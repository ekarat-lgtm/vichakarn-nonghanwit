import type { TableCfg } from "@/lib/adminConfig";
import type { Row } from "@/lib/store";

export default function AdminForm({
  cfg, action, values, submitLabel = "บันทึก",
}: {
  cfg: TableCfg;
  action: (fd: FormData) => void | Promise<void>;
  values?: Row;
  submitLabel?: string;
}) {
  const v = (name: string, d?: string) => {
    const x = values?.[name];
    if (x === undefined || x === null) return d ?? "";
    return typeof x === "string" && /^\d{4}-\d{2}-\d{2}T/.test(x) ? x.slice(0, 10) : String(x);
  };
  return (
    <form action={action} className="stack">
      {cfg.fields.map((f) => (
        <label key={f.name}>
          {f.label}{f.required && " *"}
          {f.type === "textarea" ? (
            <textarea name={f.name} required={f.required} defaultValue={v(f.name)} />
          ) : f.type === "select" ? (
            <select name={f.name} defaultValue={v(f.name, f.options?.[0])}>
              {f.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === "bool" ? (
            <select name={f.name} defaultValue={values ? String(values[f.name] !== false) : "true"}>
              <option value="true">{f.labels?.[0] ?? "ใช่"}</option>
              <option value="false">{f.labels?.[1] ?? "ไม่"}</option>
            </select>
          ) : f.type === "file" ? (
            <input type="file" name={f.name} accept={f.accept} />
          ) : (
            <input
              name={f.name}
              type={f.type === "url" ? "url" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
              required={f.required}
              defaultValue={v(f.name, f.defaultValue)}
            />
          )}
          {f.hint && <span className="hint">{f.hint}{f.type === "file" && values ? " · เว้นว่างเพื่อใช้ไฟล์เดิม" : ""}</span>}
        </label>
      ))}
      <button className="btn brand">{submitLabel}</button>
    </form>
  );
}
