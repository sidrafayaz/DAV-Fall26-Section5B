# DVA Lab 8: Interactive Data Visualization (D3.js)

**Roll Number:** 24I-2551  
**Section:** DS-(B)  
**Dataset:** `gapminder.csv` / `dataset/gapminder.csv`  

---

## 1. Files in This Submission

| File | Description |
| :--- | :--- |
| [`24I-2551_DS-B_Lab08_Task1.html`](file:///c:/Users/VICTUS/Documents/Sem5/DVA%20LAB/lab8/24I-2551_DS-B_Lab08_Task1.html) | **Task 1:** Top 10 Richest Countries (1952 vs 2007) with animated transitions, continent coloring, tooltip, and code comments. |
| [`24I-2551_DS-B_Lab08_Task2.html`](file:///c:/Users/VICTUS/Documents/Sem5/DVA%20LAB/lab8/24I-2551_DS-B_Lab08_Task2.html) | **Task 2:** 142 Country Comparison with Scrollable View, Initial Unfixed Debug View, and DevTools diagnostic answers. |
| [`README.md`](file:///c:/Users/VICTUS/Documents/Sem5/DVA%20LAB/lab8/README.md) | **Instructions:** How to run each task and quick summary. |
| [`dataset/gapminder.csv`](file:///c:/Users/VICTUS/Documents/Sem5/DVA%20LAB/lab8/dataset/gapminder.csv) | Primary dataset file in required folder structure. |

---

## 2. How to Run Each Task (1–2 Steps)

### To Run Task 1:
1. Open this folder in **VS Code**, right-click [`24I-2551_DS-B_Lab08_Task1.html`](file:///c:/Users/VICTUS/Documents/Sem5/DVA%20LAB/lab8/24I-2551_DS-B_Lab08_Task1.html), and select **"Open with Live Server"**.
2. Click the **"Year 1952"** and **"Year 2007"** buttons to see the bars smoothly animate, and hover over any bar to view the exact GDP per capita.

### To Run Task 2:
1. Right-click [`24I-2551_DS-B_Lab08_Task2.html`](file:///c:/Users/VICTUS/Documents/Sem5/DVA%20LAB/lab8/24I-2551_DS-B_Lab08_Task2.html) and select **"Open with Live Server"**.
2. Scroll through all 142 country bars inside the scrollable container, or click **"Initial Unfixed / Debug View"** and **"Top 10 Richest Countries"** to switch views.

*(Alternative Terminal Method: Run `python -m http.server 8000` in terminal and visit `http://localhost:8000/24I-2551_DS-B_Lab08_Task1.html` or `http://localhost:8000/24I-2551_DS-B_Lab08_Task2.html`).*

---

## 3. Quick Summary & Answers (Also Embedded Under Code in Each File)

### Task 1 Key Answers:
- **Step 1 (Prediction):** Norway is richest in 2007 ($49,357), whereas Kuwait was richest in 1952 ($108,382); it is not the same country.
- **Step 6.1 (Top 10 Line):** `.slice(0, 10)` keeps only the top 10 rows from the descending-sorted country array.
- **Step 6.2 (Why `d => d.country`?):** It serves as a key function that gives SVG bars object constancy so D3 animates existing elements by name rather than array index.
- **Step 6.3 (Why short bars in 1952?):** Kuwait's GDP per capita was unusually massive ($108,382), expanding the linear x-axis scale so wide that other countries appear very short.

### Task 2 Key Diagnostic Answers:
- **Q1 (Expected vs Actual):** Expected 142 bars, but got 1,704 rectangles because the raw dataset contains 12 years per country and was not filtered to a single year.
- **Q2 (Bar Height & Readability):** Each bar is only ~2.2px tall and labels overlap into an illegible black smudge in a standard 500px window.
- **Q3 (Readability Fix):** Filtering to 2007 and wrapping the chart in a fixed-height scrollable container (`max-height: 580px; overflow-y: auto`) with a tall SVG (~3,500px) gives each country ~22px height.
- **Q4 (Top 10 & Norway):** Norway is first ($49,357) once data is sorted descending by `gdpPercap` and sliced to the top 10 (`.slice(0, 10)`).
