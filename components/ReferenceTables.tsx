import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BookOpenIcon } from "@heroicons/react/24/outline";

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200">
      <table className="w-full min-w-[280px] border-collapse text-sm">
        <thead>
          <tr className="bg-stone-100/80">
            {headers.map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b border-stone-200 px-4 py-3 text-start font-semibold text-stone-800"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 1 ? "bg-stone-50/60" : "bg-white"}
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-stone-100 px-4 py-2.5 text-stone-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReferenceTables() {
  return (
    <Card nested className="border-0 bg-transparent p-0 shadow-none">
      <SectionHeader
        icon={<BookOpenIcon className="h-6 w-6" strokeWidth={1.75} />}
        title="טבלאות עזר"
        subtitle="הערכות לחדר טיפוסי — עדיף להסתמך על תחושת הבצק."
      />

      <h3 className="mb-3 mt-2 font-serif text-lg font-semibold text-stone-900">
        התפחה ראשונית לפי טמפרטורה
      </h3>
      <Table
        headers={["טמפ׳ חדר", "זמן התפחה בקערה"]}
        rows={[
          ["18°C", "כ־5–8 שעות"],
          ["20°C", "כ־4–6 שעות"],
          ["22°C", "כ־3.5–5 שעות"],
          ["24°C", "כ־3–4 שעות"],
          ["26°C", "כ־2.5–3.5 שעות"],
        ]}
      />

      <h3 className="mb-3 mt-8 font-serif text-lg font-semibold text-stone-900">
        מחמצת לשיא (ב־~22°C)
      </h3>
      <Table
        headers={["יחס", "זמן לשיא"]}
        rows={[
          ["1 : 1 : 1", "כ־4–6 שעות"],
          ["1 : 2 : 2", "כ־6–8 שעות"],
          ["1 : 3 : 3", "כ־8–12 שעות"],
          ["1 : 4 : 4+", "כ־12–16+ שעות"],
        ]}
      />

      <h3 className="mb-3 mt-8 font-serif text-lg font-semibold text-stone-900">
        התפחה במקרר
      </h3>
      <Table
        headers={["טווח", "הערות"]}
        rows={[
          ["8–12 שעות", "חמוץ מתון"],
          ["12–18 שעות", "טעמים עמוקים"],
          ["18–24+ שעות", "חמוץ חזק — עקבו אחרי הבצק"],
        ]}
      />
    </Card>
  );
}
