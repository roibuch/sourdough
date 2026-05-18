# Sourdough Master (Next.js)

מחשבון מחמצת בעברית — מיגרציה ל־Next.js App Router + TypeScript + Tailwind.

## שלב 1 (נוכחי)

- `RecipeCalculator` — חישוב בצק, תערובות קמח, הידרציה אמיתית, בסינאז׳, אזהרות
- שמירה ב־`localStorage` + שיתוף בפרמטרי URL
- ממשק מובייל עם `inputMode` וכפתורי +/−

## פיתוח

```bash
npm install
npm run dev
```

פתחו [http://localhost:3000](http://localhost:3000).

## בנייה סטטית (GitHub Pages)

```bash
npm run build
```

הפלט ב־`out/`. לפריסה בתת-נתיב של repo:

```bash
# PowerShell
$env:GITHUB_PAGES="true"
$env:GITHUB_REPOSITORY_NAME="sourdough"
npm run build
```

## Vercel

הסירו `output: 'export'` מ־`next.config.ts` או פרסו כ־static export — Vercel תומך בשניהם.

## קובץ HTML ישן

`sourdough_app.html` נשאר בשורש לעיון; הגרסה הפעילה היא באפליקציית Next.
