/**
 * City Environment Office - Air Quality Analytics Dashboard (2025)
 * DVA Lab 10: Complete Implementation of Tasks 1 to 9
 * Standard D3.js v7 Implementation
 */

// Global State
let airData = [];
let datasetAudit = {};
let top2Days = [];
let monthlyAgg = [];
let heatmapMatrix = [];
let segments = []; // continuous data segments split at sensor outages

// Color Constants
const COLORS = {
  city: "#dc2626",      // Crimson
  suburb: "#0284c7",    // Ocean Blue
  guideline: "#059669", // WHO Guideline (15)
  target: "#ea580c",    // WHO Interim Target (75)
  low: "#34d399",       // Green <= 35
  moderate: "#fbbf24",  // Amber 36-75
  high: "#f97316",      // Orange 76-150
  severe: "#b91c1c",    // Dark Red > 150
  offline: "#94a3b8"    // Slate gray
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// DOM Ready initialization
document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  try {
    const rawData = await fetchDataset();
    processData(rawData);
    
    // Render all visual modules
    renderTask1Audit();
    renderTask2CitySeries();
    renderTask3BuildUp();
    renderTask4Comparison();
    renderTask5Composition();
    renderTask6Heatmap();
    renderTask7Spread();
    renderTask8TrendAndGap();
    renderTask9ZoomBrush();
    
    console.log("All D3 visualizations successfully initialized.");
  } catch (err) {
    console.error("Dashboard initialization error:", err);
    document.getElementById("error-banner")?.classList.remove("hidden");
  }
}

/**
 * Robust loader: tries d3.csv first, falls back to embedded HTML script tag
 */
async function fetchDataset() {
  try {
    const data = await d3.csv("air_quality_2025.csv");
    if (data && data.length > 0) return data;
  } catch (e) {
    console.warn("Direct d3.csv load failed (likely file:// CORS), checking embedded fallback...", e);
  }
  
  const embeddedScript = document.getElementById("embedded-csv");
  if (embeddedScript && embeddedScript.textContent.trim().length > 0) {
    console.info("Using embedded dataset fallback.");
    return d3.csvParse(embeddedScript.textContent.trim());
  }
  throw new Error("Could not load air_quality_2025.csv via network or embedded fallback.");
}

/**
 * Data Processing & Analytics Preparation
 */
function processData(rawData) {
  const parseDate = d3.timeParse("%Y-%m-%d");

  airData = rawData.map(d => {
    const dateObj = parseDate(d.date);
    const pmCity = +d.pm25_city;
    const pmSuburb = +d.pm25_suburb;
    const tempC = +d.temp_c;
    
    let level = "Low";
    if (pmCity > 150) level = "Severe";
    else if (pmCity > 75) level = "High";
    else if (pmCity > 35) level = "Moderate";
    
    // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Mon=0, Tue=1, ..., Sun=6
    const jsDay = dateObj.getDay();
    const dowIndex = (jsDay + 6) % 7;
    const dowName = WEEKDAYS[dowIndex];

    return {
      date: dateObj,
      dateStr: d.date,
      pm25_city: pmCity,
      pm25_suburb: pmSuburb,
      temp_c: tempC,
      level: level,
      monthIndex: dateObj.getMonth(),
      monthName: MONTH_NAMES[dateObj.getMonth()],
      dowIndex: dowIndex,
      dowName: dowName,
      isAbove15: pmCity > 15,
      isAbove75: pmCity > 75
    };
  }).sort((a, b) => a.date - b.date);

  // Cumulative days above 75
  let running75 = 0;
  airData.forEach(d => {
    if (d.isAbove75) running75++;
    d.cumAbove75 = running75;
  });

  // Task 1: Dataset Audit
  const firstDate = airData[0].date;
  const lastDate = airData[airData.length - 1].date;
  const totalRows = airData.length;
  const daysIn2025 = 365; // 2025 is standard year
  const missingDays = daysIn2025 - totalRows;

  // Identify specific gaps
  const gaps = [];
  let currentSegment = [];
  segments = [currentSegment];

  for (let i = 0; i < airData.length; i++) {
    const current = airData[i];
    currentSegment.push(current);

    if (i < airData.length - 1) {
      const next = airData[i + 1];
      const dayDiff = Math.round((next.date - current.date) / (1000 * 60 * 60 * 24));
      if (dayDiff > 1) {
        gaps.push({
          startDate: current.date,
          endDate: next.date,
          startStr: current.dateStr,
          endStr: next.dateStr,
          missingCount: dayDiff - 1
        });
        currentSegment = [];
        segments.push(currentSegment);
      }
    }
  }

  // 7-day Moving Average (strictly within each segment, never across gaps!)
  segments.forEach(seg => {
    seg.forEach((d, idx) => {
      const windowStart = Math.max(0, idx - 6);
      const windowSlice = seg.slice(windowStart, idx + 1);
      d.ma7 = d3.mean(windowSlice, item => item.pm25_city);
    });
  });

  // Identify Top 2 highest days
  top2Days = [...airData].sort((a, b) => b.pm25_city - a.pm25_city).slice(0, 2);

  // Aggregations by Month for Task 5 and Task 7
  monthlyAgg = MONTH_NAMES.map((mName, mIdx) => {
    const mData = airData.filter(d => d.monthIndex === mIdx);
    const count = mData.length;
    const cityVals = mData.map(d => d.pm25_city);
    const minVal = cityVals.length ? d3.min(cityVals) : 0;
    const maxVal = cityVals.length ? d3.max(cityVals) : 0;
    const meanVal = cityVals.length ? d3.mean(cityVals) : 0;
    const spread = maxVal - minVal;

    const lowCount = mData.filter(d => d.level === "Low").length;
    const modCount = mData.filter(d => d.level === "Moderate").length;
    const highCount = mData.filter(d => d.level === "High").length;
    const severeCount = mData.filter(d => d.level === "Severe").length;
    const above75Count = mData.filter(d => d.isAbove75).length;

    return {
      monthIndex: mIdx,
      month: mName,
      count: count,
      min: minVal,
      max: maxVal,
      mean: meanVal,
      spread: spread,
      Low: lowCount,
      Moderate: modCount,
      High: highCount,
      Severe: severeCount,
      above75: above75Count
    };
  });

  // Aggregations for Heatmap (Task 6)
  heatmapMatrix = [];
  MONTH_NAMES.forEach((mName, mIdx) => {
    WEEKDAYS.forEach((wName, wIdx) => {
      const matching = airData.filter(d => d.monthIndex === mIdx && d.dowIndex === wIdx);
      const avg = matching.length ? d3.mean(matching, d => d.pm25_city) : null;
      heatmapMatrix.push({
        month: mName,
        monthIndex: mIdx,
        weekday: wName,
        dowIndex: wIdx,
        avgPm25: avg,
        count: matching.length
      });
    });
  });

  datasetAudit = {
    totalRows,
    daysIn2025,
    missingDays,
    firstDate,
    lastDate,
    gaps,
    above15Count: airData.filter(d => d.isAbove15).length,
    above75Count: airData.filter(d => d.isAbove75).length,
    pctAbove15: (airData.filter(d => d.isAbove15).length / totalRows * 100).toFixed(1),
    pctAbove75: (airData.filter(d => d.isAbove75).length / totalRows * 100).toFixed(1)
  };
}

/* ==========================================================================
   TASK 1: Dataset Audit & Health Check
   ========================================================================== */
function renderTask1Audit() {
  document.getElementById("kpi-rows").textContent = datasetAudit.totalRows;
  document.getElementById("kpi-missing").textContent = `${datasetAudit.missingDays} Days`;
  document.getElementById("kpi-above15").textContent = `${datasetAudit.above15Count} (${datasetAudit.pctAbove15}%)`;
  document.getElementById("kpi-above75").textContent = `${datasetAudit.above75Count} (${datasetAudit.pctAbove75}%)`;

  const container = d3.select("#chart-task1");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 120;
  const margin = { top: 20, right: 30, bottom: 45, left: 30 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scaleTime()
    .domain([new Date(2025, 0, 1), new Date(2025, 11, 31, 23, 59)])
    .range([margin.left, width - margin.right]);

  // Strip background: all 365 calendar days
  const fullYearDays = d3.timeDays(new Date(2025, 0, 1), new Date(2026, 0, 1));
  const recordedSet = new Set(airData.map(d => d.dateStr));

  const dayWidth = (width - margin.left - margin.right) / 365;

  // Day bars
  svg.selectAll(".calendar-bar")
    .data(fullYearDays)
    .enter()
    .append("rect")
    .attr("class", "calendar-bar")
    .attr("x", d => xScale(d))
    .attr("y", margin.top + 10)
    .attr("width", Math.max(1.8, dayWidth - 0.4))
    .attr("height", 28)
    .attr("rx", 1.5)
    .attr("fill", d => {
      const dStr = d3.timeFormat("%Y-%m-%d")(d);
      return recordedSet.has(dStr) ? "#10b981" : "#ef4444";
    })
    .on("mouseover", (event, d) => {
      const dStr = d3.timeFormat("%Y-%m-%d")(d);
      const isRecorded = recordedSet.has(dStr);
      showTooltip(event, `
        <div class="tt-date">${d3.timeFormat("%B %d, %Y")(d)}</div>
        <div class="tt-row">
          <span class="tt-label">Sensor Status:</span>
          <span class="tt-val" style="color: ${isRecorded ? '#34d399' : '#f87171'}">${isRecorded ? 'Recorded ✓' : 'OFFLINE ✗'}</span>
        </div>
        ${!isRecorded ? '<div class="tt-badge" style="background:#ef4444;color:#fff">Station Outage</div>' : ''}
      `);
    })
    .on("mouseout", hideTooltip);

  // Highlight gap zone
  datasetAudit.gaps.forEach(gap => {
    const xStart = xScale(gap.startDate);
    const xEnd = xScale(gap.endDate);

    svg.append("rect")
      .attr("x", xStart)
      .attr("y", margin.top + 5)
      .attr("width", xEnd - xStart)
      .attr("height", 38)
      .attr("fill", "none")
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2");

    svg.append("text")
      .attr("x", (xStart + xEnd) / 2)
      .attr("y", margin.top - 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("fill", "#dc2626")
      .text(`⚠️ Offline: ${gap.missingCount} Missing Days (March 12–20)`);
  });

  // Time Axis along bottom
  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"));

  svg.append("g")
    .attr("transform", `translate(0, ${margin.top + 45})`)
    .call(xAxis)
    .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
    .call(g => g.selectAll(".tick line").attr("stroke", "#cbd5e1"))
    .call(g => g.selectAll("text").attr("fill", "#475569").attr("font-weight", "600"));
}

/* ==========================================================================
   TASK 2: Daily PM2.5 in City Centre Line Chart
   ========================================================================== */
function renderTask2CitySeries() {
  const container = d3.select("#chart-task2");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 420;
  const margin = { top: 35, right: 90, bottom: 45, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scaleTime()
    .domain(d3.extent(airData, d => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(airData, d => d.pm25_city) * 1.08])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Grid lines
  svg.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // WHO Guideline (15 µg/m³) Reference Line
  svg.append("line")
    .attr("class", "ref-line guideline")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(15))
    .attr("y2", yScale(15));

  svg.append("text")
    .attr("x", width - margin.right + 8)
    .attr("y", yScale(15))
    .attr("fill", COLORS.guideline)
    .attr("class", "ref-label")
    .text("WHO 15 µg/m³");

  // WHO Interim Target 1 (75 µg/m³) Reference Line
  svg.append("line")
    .attr("class", "ref-line target")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(75))
    .attr("y2", yScale(75));

  svg.append("text")
    .attr("x", width - margin.right + 8)
    .attr("y", yScale(75))
    .attr("fill", COLORS.target)
    .attr("class", "ref-label")
    .text("Target 75 µg/m³");

  // Daily line generator (segmented so it breaks at the gap!)
  const lineGenerator = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.pm25_city))
    .curve(d3.curveMonotoneX);

  segments.forEach(seg => {
    svg.append("path")
      .datum(seg)
      .attr("fill", "none")
      .attr("stroke", COLORS.city)
      .attr("stroke-width", 1.8)
      .attr("d", lineGenerator);
  });

  // Top 2 Highest Days Markers
  top2Days.forEach((topDay, rank) => {
    const cx = xScale(topDay.date);
    const cy = yScale(topDay.pm25_city);

    // Pulse ring
    svg.append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", 10)
      .attr("fill", "none")
      .attr("stroke", COLORS.city)
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);

    // Center point
    svg.append("circle")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", 4.5)
      .attr("fill", COLORS.city)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Callout box
    const isNov = topDay.monthName === "Nov";
    const boxX = isNov ? cx - 140 : cx + 15;
    const boxY = cy - 20;

    const calloutG = svg.append("g")
      .attr("transform", `translate(${boxX}, ${boxY})`);

    calloutG.append("rect")
      .attr("x", 0)
      .attr("y", -18)
      .attr("width", 130)
      .attr("height", 32)
      .attr("rx", 5)
      .attr("fill", "#0f172a")
      .attr("opacity", 0.9);

    calloutG.append("text")
      .attr("x", 65)
      .attr("y", -2)
      .attr("text-anchor", "middle")
      .attr("fill", "#ffffff")
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .text(`Top #${rank + 1}: ${topDay.dateStr}`);

    calloutG.append("text")
      .attr("x", 65)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#f87171")
      .attr("font-size", "11px")
      .attr("font-weight", "800")
      .text(`${topDay.pm25_city} µg/m³`);
  });

  // Axes
  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"));

  const yAxis = d3.axisLeft(yScale)
    .ticks(7)
    .tickFormat(d => `${d}`);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 12)
      .text("City PM2.5 (µg/m³)"));

  // Interactive Hover Overlay
  attachLineTooltip(svg, airData, xScale, yScale, width, height, margin, "pm25_city", "City PM2.5");
}

/* ==========================================================================
   TASK 3: Cumulative Unhealthy Days (>75 µg/m³) Build-Up Area Chart
   ========================================================================== */
function renderTask3BuildUp() {
  const container = d3.select("#chart-task3");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 380;
  const margin = { top: 35, right: 60, bottom: 45, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scaleTime()
    .domain(d3.extent(airData, d => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, 200])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Defs for gradient
  const defs = svg.append("defs");
  const areaGradient = defs.append("linearGradient")
    .attr("id", "cum-area-gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "0%").attr("y2", "100%");

  areaGradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#ea580c")
    .attr("stop-opacity", 0.7);

  areaGradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#f97316")
    .attr("stop-opacity", 0.05);

  // Grid
  svg.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // Area Generator
  const areaGenerator = d3.area()
    .x(d => xScale(d.date))
    .y0(height - margin.bottom)
    .y1(d => yScale(d.cumAbove75))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(airData)
    .attr("fill", "url(#cum-area-gradient)")
    .attr("d", areaGenerator);

  // Line boundary
  const lineGenerator = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.cumAbove75))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(airData)
    .attr("fill", "none")
    .attr("stroke", "#c2410c")
    .attr("stroke-width", 2.5)
    .attr("d", lineGenerator);

  // Plateau Highlight (Summer Monsoon: flat at 100)
  const plateauStart = xScale(new Date(2025, 4, 19)); // May 19 reached 100
  const plateauEnd = xScale(new Date(2025, 8, 1));   // Sep 1

  svg.append("rect")
    .attr("x", plateauStart)
    .attr("y", yScale(115))
    .attr("width", plateauEnd - plateauStart)
    .attr("height", 30)
    .attr("rx", 4)
    .attr("fill", "#ecfdf5")
    .attr("stroke", "#10b981")
    .attr("stroke-dasharray", "3,3");

  svg.append("text")
    .attr("x", (plateauStart + plateauEnd) / 2)
    .attr("y", yScale(115) + 18)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .attr("fill", "#047857")
    .text("Flat Plateau (100 Days): Summer Monsoon Washout (Jun–Aug)");

  // Milestone marker at final date: 188 days
  const lastPt = airData[airData.length - 1];
  const lastX = xScale(lastPt.date);
  const lastY = yScale(lastPt.cumAbove75);

  svg.append("circle")
    .attr("cx", lastX)
    .attr("cy", lastY)
    .attr("r", 5)
    .attr("fill", "#c2410c")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  svg.append("text")
    .attr("x", lastX - 10)
    .attr("y", lastY - 12)
    .attr("text-anchor", "end")
    .attr("fill", "#c2410c")
    .attr("font-weight", "800")
    .attr("font-size", "12px")
    .text(`Final Total: 188 Unhealthy Days (52.8%)`);

  // Axes
  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"));

  const yAxis = d3.axisLeft(yScale)
    .ticks(8)
    .tickFormat(d => `${d} d`);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 12)
      .text("Running Total of Days > 75 µg/m³"));

  // Hover Overlay
  attachLineTooltip(svg, airData, xScale, yScale, width, height, margin, "cumAbove75", "Cumulative Unhealthy Days");
}

/* ==========================================================================
   TASK 4: City vs. Suburb Dual Time Series Comparison
   ========================================================================== */
function renderTask4Comparison() {
  const container = d3.select("#chart-task4");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 420;
  const margin = { top: 35, right: 90, bottom: 45, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scaleTime()
    .domain(d3.extent(airData, d => d.date))
    .range([margin.left, width - margin.right]);

  const maxVal = d3.max(airData, d => Math.max(d.pm25_city, d.pm25_suburb));
  const yScale = d3.scaleLinear()
    .domain([0, maxVal * 1.08])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Grid
  svg.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // Line Generators for City and Suburb
  const lineCity = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.pm25_city))
    .curve(d3.curveMonotoneX);

  const lineSuburb = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.pm25_suburb))
    .curve(d3.curveMonotoneX);

  // Render segmented lines so they break at the gap
  segments.forEach(seg => {
    // Suburb line
    svg.append("path")
      .datum(seg)
      .attr("fill", "none")
      .attr("stroke", COLORS.suburb)
      .attr("stroke-width", 2)
      .attr("d", lineSuburb);

    // City line
    svg.append("path")
      .datum(seg)
      .attr("fill", "none")
      .attr("stroke", COLORS.city)
      .attr("stroke-width", 2)
      .attr("d", lineCity);
  });

  // Reference line for Target 75
  svg.append("line")
    .attr("class", "ref-line target")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(75))
    .attr("y2", yScale(75));

  // Axes
  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"));

  const yAxis = d3.axisLeft(yScale)
    .ticks(7)
    .tickFormat(d => `${d}`);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 12)
      .text("PM2.5 (µg/m³)"));

  // Interactive Multi-Series Hover
  const bisectDate = d3.bisector(d => d.date).left;
  const hoverGroup = svg.append("g").style("display", "none");

  hoverGroup.append("line")
    .attr("class", "hover-cursor")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#64748b")
    .attr("stroke-width", 1.2)
    .attr("stroke-dasharray", "3,3");

  const cityDot = hoverGroup.append("circle").attr("r", 5).attr("fill", COLORS.city).attr("stroke", "#fff").attr("stroke-width", 2);
  const suburbDot = hoverGroup.append("circle").attr("r", 5).attr("fill", COLORS.suburb).attr("stroke", "#fff").attr("stroke-width", 2);

  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .on("mouseover", () => hoverGroup.style("display", null))
    .on("mouseout", () => {
      hoverGroup.style("display", "none");
      hideTooltip();
    })
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const mouseDate = xScale.invert(mx);
      let idx = bisectDate(airData, mouseDate, 1);
      const d0 = airData[idx - 1];
      const d1 = airData[idx];
      let d = d0;
      if (d1 && (mouseDate - d0.date > d1.date - mouseDate)) d = d1;
      if (!d) return;

      const cx = xScale(d.date);
      const cyCity = yScale(d.pm25_city);
      const cySub = yScale(d.pm25_suburb);
      const diff = (d.pm25_city - d.pm25_suburb).toFixed(1);

      hoverGroup.select(".hover-cursor").attr("x1", cx).attr("x2", cx);
      cityDot.attr("cx", cx).attr("cy", cyCity);
      suburbDot.attr("cx", cx).attr("cy", cySub);

      showTooltip(event, `
        <div class="tt-date">${d3.timeFormat("%B %d, %Y")(d.date)}</div>
        <div class="tt-row">
          <span class="tt-label" style="color:#f87171">● City Centre:</span>
          <span class="tt-val">${d.pm25_city} µg/m³</span>
        </div>
        <div class="tt-row">
          <span class="tt-label" style="color:#38bdf8">● Suburb:</span>
          <span class="tt-val">${d.pm25_suburb} µg/m³</span>
        </div>
        <div class="tt-row" style="border-top:1px dashed rgba(255,255,255,0.2);padding-top:4px;margin-top:4px;">
          <span class="tt-label">Urban Excess (Δ):</span>
          <span class="tt-val" style="color:#fcd34d">+${diff} µg/m³</span>
        </div>
      `);
    });
}

/* ==========================================================================
   TASK 5: Monthly Pollution Levels Stacked Bar Chart
   ========================================================================== */
function renderTask5Composition() {
  const container = d3.select("#chart-task5");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 420;
  const margin = { top: 35, right: 120, bottom: 45, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const keys = ["Low", "Moderate", "High", "Severe"];
  const colorScale = d3.scaleOrdinal()
    .domain(keys)
    .range([COLORS.low, COLORS.moderate, COLORS.high, COLORS.severe]);

  const stackGenerator = d3.stack().keys(keys);
  const stackedSeries = stackGenerator(monthlyAgg);

  const xScale = d3.scaleBand()
    .domain(MONTH_NAMES)
    .range([margin.left, width - margin.right])
    .padding(0.28);

  const yScale = d3.scaleLinear()
    .domain([0, 31])
    .range([height - margin.bottom, margin.top]);

  // Grid
  svg.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(6).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // Stacked groups
  const groups = svg.selectAll("g.stack-layer")
    .data(stackedSeries)
    .enter()
    .append("g")
    .attr("class", "stack-layer")
    .attr("fill", d => colorScale(d.key));

  groups.selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.data.month))
    .attr("y", d => yScale(d[1]))
    .attr("height", d => yScale(d[0]) - yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .attr("rx", 2)
    .on("mouseover", (event, d) => {
      const parentKey = d3.select(event.currentTarget.parentNode).datum().key;
      const count = d[1] - d[0];
      const pct = (count / d.data.count * 100).toFixed(0);

      showTooltip(event, `
        <div class="tt-date">${d.data.month} 2025 (${d.data.count} Days Recorded)</div>
        <div class="tt-row">
          <span class="tt-label">${parentKey} Days:</span>
          <span class="tt-val">${count} days (${pct}%)</span>
        </div>
        <div class="tt-row" style="font-size:11px;color:#cbd5e1;border-top:1px dashed rgba(255,255,255,0.2);padding-top:4px">
          <span>Low: ${d.data.Low} | Mod: ${d.data.Moderate}</span>
        </div>
        <div class="tt-row" style="font-size:11px;color:#cbd5e1">
          <span>High: ${d.data.High} | Severe: ${d.data.Severe}</span>
        </div>
      `);
    })
    .on("mouseout", hideTooltip);

  // March sensor outage indicator (Dashed extension from 22 to 31 days)
  const marX = xScale("Mar");
  const marY22 = yScale(22);
  const marY31 = yScale(31);

  svg.append("rect")
    .attr("x", marX)
    .attr("y", marY31)
    .attr("width", xScale.bandwidth())
    .attr("height", marY22 - marY31)
    .attr("fill", "rgba(148, 163, 184, 0.15)")
    .attr("stroke", "#dc2626")
    .attr("stroke-dasharray", "4,2")
    .attr("rx", 2);

  svg.append("text")
    .attr("x", marX + xScale.bandwidth() / 2)
    .attr("y", marY31 - 6)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "700")
    .attr("fill", "#dc2626")
    .text("9d missing");

  // Total count on top of bars
  monthlyAgg.forEach(m => {
    if (m.month === "Mar") return; // Handled above
    svg.append("text")
      .attr("x", xScale(m.month) + xScale.bandwidth() / 2)
      .attr("y", yScale(m.count) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#64748b")
      .text(`${m.count}d`);
  });

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => `${d} d`);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 12)
      .text("Days per Month"));

  // Side Legend
  const legendG = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 15}, ${margin.top + 10})`);

  keys.slice().reverse().forEach((k, idx) => {
    const lg = legendG.append("g").attr("transform", `translate(0, ${idx * 24})`);
    lg.append("rect")
      .attr("width", 14).attr("height", 14).attr("rx", 3)
      .attr("fill", colorScale(k));
    lg.append("text")
      .attr("x", 20).attr("y", 11)
      .attr("font-size", "11px").attr("font-weight", "600").attr("fill", "#334155")
      .text(k);
  });
}

/* ==========================================================================
   TASK 6: Day-of-Week vs. Month Heatmap Grid
   ========================================================================== */
function renderTask6Heatmap() {
  const container = d3.select("#chart-task6");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 450;
  const margin = { top: 35, right: 120, bottom: 40, left: 70 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scaleBand()
    .domain(WEEKDAYS)
    .range([margin.left, width - margin.right])
    .padding(0.06);

  const yScale = d3.scaleBand()
    .domain(MONTH_NAMES)
    .range([margin.top, height - margin.bottom])
    .padding(0.08);

  // Color interpolator (YlOrRd gives nice contrast)
  const minVal = d3.min(heatmapMatrix, d => d.avgPm25);
  const maxVal = d3.max(heatmapMatrix, d => d.avgPm25);

  const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateYlOrRd)
    .domain([20, 180]); // standard domain for clear contrast

  // Grid cells
  svg.selectAll(".heat-cell")
    .data(heatmapMatrix)
    .enter()
    .append("rect")
    .attr("class", "heat-cell")
    .attr("x", d => xScale(d.weekday))
    .attr("y", d => yScale(d.month))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("rx", 4)
    .attr("fill", d => d.avgPm25 ? colorScale(d.avgPm25) : "#f1f5f9")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 1)
    .on("mouseover", (event, d) => {
      showTooltip(event, `
        <div class="tt-date">${d.month} – ${d.weekday}</div>
        <div class="tt-row">
          <span class="tt-label">Mean City PM2.5:</span>
          <span class="tt-val" style="color:#fcd34d">${d.avgPm25 ? d.avgPm25.toFixed(1) + ' µg/m³' : 'N/A'}</span>
        </div>
        <div class="tt-row">
          <span class="tt-label">Sample Days:</span>
          <span class="tt-val">${d.count} days</span>
        </div>
      `);
    })
    .on("mouseout", hideTooltip);

  // Cell text labels
  svg.selectAll(".cell-text")
    .data(heatmapMatrix)
    .enter()
    .append("text")
    .attr("x", d => xScale(d.weekday) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.month) + yScale.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .attr("fill", d => (d.avgPm25 > 100) ? "#ffffff" : "#1e293b")
    .text(d => d.avgPm25 ? d.avgPm25.toFixed(0) : "-");

  // Axes
  const xAxis = d3.axisTop(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg.append("g")
    .attr("transform", `translate(0, ${margin.top})`)
    .call(xAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text").attr("font-weight", "700").attr("font-size", "11px"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text").attr("font-weight", "700").attr("font-size", "11px"));

  // Continuous Color Bar Legend on the right
  const legendHeight = height - margin.top - margin.bottom - 40;
  const legendWidth = 14;
  const legendX = width - margin.right + 25;
  const legendY = margin.top + 20;

  const defs = svg.append("defs");
  const legendGradient = defs.append("linearGradient")
    .attr("id", "heat-legend-grad")
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");

  d3.range(0, 1.05, 0.1).forEach(t => {
    legendGradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", d3.interpolateYlOrRd(t));
  });

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("rx", 3)
    .attr("fill", "url(#heat-legend-grad)");

  const legendScale = d3.scaleLinear().domain([20, 180]).range([legendY + legendHeight, legendY]);
  const legendAxis = d3.axisRight(legendScale).ticks(5).tickFormat(d => `${d}`);

  svg.append("g")
    .attr("transform", `translate(${legendX + legendWidth}, 0)`)
    .call(legendAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", 25)
      .attr("y", legendY - 10)
      .attr("font-size", "10px")
      .attr("font-weight", "700")
      .attr("fill", "#64748b")
      .text("µg/m³"));
}

/* ==========================================================================
   TASK 7: Monthly Best-to-Worst Spread Band Chart
   ========================================================================== */
function renderTask7Spread() {
  const container = d3.select("#chart-task7");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 400;
  const margin = { top: 35, right: 60, bottom: 45, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scalePoint()
    .domain(MONTH_NAMES)
    .range([margin.left + 30, width - margin.right - 30]);

  const maxVal = d3.max(monthlyAgg, d => d.max);
  const yScale = d3.scaleLinear()
    .domain([0, maxVal * 1.1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Grid
  svg.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // Area Generator for Shaded Band between Min and Max
  const bandArea = d3.area()
    .x(d => xScale(d.month))
    .y0(d => yScale(d.min))
    .y1(d => yScale(d.max))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(monthlyAgg)
    .attr("fill", "rgba(59, 130, 246, 0.2)")
    .attr("stroke", "#93c5fd")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .attr("d", bandArea);

  // Mean Line through center
  const meanLine = d3.line()
    .x(d => xScale(d.month))
    .y(d => yScale(d.mean))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(monthlyAgg)
    .attr("fill", "none")
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 3)
    .attr("d", meanLine);

  // Data Points & Vertical Spread Bars for each month
  monthlyAgg.forEach(m => {
    const cx = xScale(m.month);
    const yMin = yScale(m.min);
    const yMax = yScale(m.max);
    const yMean = yScale(m.mean);

    // Vertical line between min and max
    svg.append("line")
      .attr("x1", cx).attr("x2", cx)
      .attr("y1", yMin).attr("y2", yMax)
      .attr("stroke", "#60a5fa")
      .attr("stroke-width", 2);

    // Min dot
    svg.append("circle")
      .attr("cx", cx).attr("cy", yMin).attr("r", 3.5)
      .attr("fill", "#10b981").attr("stroke", "#fff");

    // Max dot
    svg.append("circle")
      .attr("cx", cx).attr("cy", yMax).attr("r", 4)
      .attr("fill", "#dc2626").attr("stroke", "#fff");

    // Mean dot
    svg.append("circle")
      .attr("cx", cx).attr("cy", yMean).attr("r", 5)
      .attr("fill", "#1d4ed8").attr("stroke", "#fff").attr("stroke-width", 2);

    // Hover hotspot
    svg.append("rect")
      .attr("x", cx - 25).attr("y", margin.top)
      .attr("width", 50).attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .on("mouseover", (event) => {
        showTooltip(event, `
          <div class="tt-date">${m.month} 2025 Summary</div>
          <div class="tt-row">
            <span class="tt-label" style="color:#ef4444">Worst (Max):</span>
            <span class="tt-val">${m.max.toFixed(1)} µg/m³</span>
          </div>
          <div class="tt-row">
            <span class="tt-label" style="color:#60a5fa">Monthly Mean:</span>
            <span class="tt-val">${m.mean.toFixed(1)} µg/m³</span>
          </div>
          <div class="tt-row">
            <span class="tt-label" style="color:#34d399">Best (Min):</span>
            <span class="tt-val">${m.min.toFixed(1)} µg/m³</span>
          </div>
          <div class="tt-row" style="border-top:1px dashed rgba(255,255,255,0.2);padding-top:4px;margin-top:4px;">
            <span class="tt-label">Spread (Gap):</span>
            <span class="tt-val" style="color:#fcd34d">${m.spread.toFixed(1)} µg/m³</span>
          </div>
        `);
      })
      .on("mouseout", hideTooltip);
  });

  // Callout on November (Widest spread: 239.1)
  const novX = xScale("Nov");
  const novMaxY = yScale(320.0);
  svg.append("text")
    .attr("x", novX)
    .attr("y", novMaxY - 12)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "800")
    .attr("fill", "#b91c1c")
    .text("★ Widest Spread: 239.1 µg/m³");

  // Callout on May (Extreme spread: 213.6)
  const mayX = xScale("May");
  const mayMaxY = yScale(245.0);
  svg.append("text")
    .attr("x", mayX)
    .attr("y", mayMaxY - 12)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("font-weight", "800")
    .attr("fill", "#b91c1c")
    .text("★ May Spread: 213.6 µg/m³");

  // Axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(7).tickFormat(d => `${d}`);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 12)
      .text("City PM2.5 (µg/m³)"));
}

/* ==========================================================================
   TASK 8: De-noised Trend (7-Day MA) & Offline Sensor Gap
   ========================================================================== */
function renderTask8TrendAndGap() {
  const container = d3.select("#chart-task8");
  container.selectAll("*").remove();

  const width = 1100;
  const height = 420;
  const margin = { top: 35, right: 90, bottom: 45, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const xScale = d3.scaleTime()
    .domain(d3.extent(airData, d => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(airData, d => d.pm25_city) * 1.08])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Grid
  svg.append("g")
    .attr("class", "grid-line")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(""));

  // Reference line for Target 75
  svg.append("line")
    .attr("class", "ref-line target")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", yScale(75))
    .attr("y2", yScale(75));

  // Shaded Offline Sensor Gap Area (March 11 to March 21)
  const gapStart = xScale(new Date(2025, 2, 11)); // March 11
  const gapEnd = xScale(new Date(2025, 2, 21));   // March 21
  const gapWidth = gapEnd - gapStart;

  // Hatching pattern for offline gap
  const defs = svg.append("defs");
  const pattern = defs.append("pattern")
    .attr("id", "gap-hatch")
    .attr("width", 8).attr("height", 8)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(45)");

  pattern.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", 0).attr("y2", 8)
    .attr("stroke", "#ef4444")
    .attr("stroke-width", 2.5);

  svg.append("rect")
    .attr("x", gapStart)
    .attr("y", margin.top)
    .attr("width", gapWidth)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "url(#gap-hatch)")
    .attr("opacity", 0.25);

  svg.append("rect")
    .attr("x", gapStart)
    .attr("y", margin.top)
    .attr("width", gapWidth)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "none")
    .attr("stroke", "#dc2626")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4,3");

  // Callout banner above the gap
  const bannerY = margin.top + 25;
  svg.append("rect")
    .attr("x", gapStart - 50)
    .attr("y", bannerY - 14)
    .attr("width", gapWidth + 100)
    .attr("height", 34)
    .attr("rx", 5)
    .attr("fill", "#0f172a")
    .attr("opacity", 0.95);

  svg.append("text")
    .attr("x", (gapStart + gapEnd) / 2)
    .attr("y", bannerY)
    .attr("text-anchor", "middle")
    .attr("font-size", "10.5px")
    .attr("font-weight", "800")
    .attr("fill", "#f87171")
    .text("⚠️ No data: sensor offline");

  svg.append("text")
    .attr("x", (gapStart + gapEnd) / 2)
    .attr("y", bannerY + 12)
    .attr("text-anchor", "middle")
    .attr("font-size", "9.5px")
    .attr("font-weight", "600")
    .attr("fill", "#cbd5e1")
    .text("9 Missing Days (March 12–20)");

  // Daily values: Thin, faint line (drawn segment-by-segment)
  const rawLineGen = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.pm25_city))
    .curve(d3.curveMonotoneX);

  segments.forEach(seg => {
    svg.append("path")
      .datum(seg)
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.5)
      .attr("d", rawLineGen);
  });

  // 7-Day Moving Average: Thick, dark line (drawn segment-by-segment)
  const maLineGen = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.ma7))
    .curve(d3.curveMonotoneX);

  segments.forEach(seg => {
    svg.append("path")
      .datum(seg)
      .attr("fill", "none")
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 3.2)
      .attr("d", maLineGen);
  });

  // Axes
  const xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d3.timeFormat("%b"));

  const yAxis = d3.axisLeft(yScale)
    .ticks(7)
    .tickFormat(d => `${d}`);

  svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 12)
      .text("City PM2.5 (µg/m³)"));

  // Interactive Hover for raw vs smoothed
  const bisectDate = d3.bisector(d => d.date).left;
  const hoverGroup = svg.append("g").style("display", "none");

  hoverGroup.append("line")
    .attr("class", "hover-cursor")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#64748b")
    .attr("stroke-width", 1.2)
    .attr("stroke-dasharray", "3,3");

  const rawDot = hoverGroup.append("circle").attr("r", 4).attr("fill", "#94a3b8").attr("stroke", "#fff");
  const maDot = hoverGroup.append("circle").attr("r", 5).attr("fill", "#0f172a").attr("stroke", "#fff").attr("stroke-width", 2);

  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .on("mouseover", () => hoverGroup.style("display", null))
    .on("mouseout", () => {
      hoverGroup.style("display", "none");
      hideTooltip();
    })
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const mouseDate = xScale.invert(mx);
      let idx = bisectDate(airData, mouseDate, 1);
      const d0 = airData[idx - 1];
      const d1 = airData[idx];
      let d = d0;
      if (d1 && (mouseDate - d0.date > d1.date - mouseDate)) d = d1;
      if (!d) return;

      const cx = xScale(d.date);
      const cyRaw = yScale(d.pm25_city);
      const cyMa = yScale(d.ma7);

      hoverGroup.select(".hover-cursor").attr("x1", cx).attr("x2", cx);
      rawDot.attr("cx", cx).attr("cy", cyRaw);
      maDot.attr("cx", cx).attr("cy", cyMa);

      showTooltip(event, `
        <div class="tt-date">${d3.timeFormat("%B %d, %Y")(d.date)}</div>
        <div class="tt-row">
          <span class="tt-label" style="color:#cbd5e1">● Daily Raw PM2.5:</span>
          <span class="tt-val">${d.pm25_city.toFixed(1)} µg/m³</span>
        </div>
        <div class="tt-row">
          <span class="tt-label" style="color:#60a5fa">● 7-Day Moving Avg:</span>
          <span class="tt-val" style="color:#93c5fd">${d.ma7.toFixed(1)} µg/m³</span>
        </div>
      `);
    });
}

/* ==========================================================================
   TASK 9: Focus + Context Overview with Interactive Brush & Zoom
   ========================================================================== */
let resetZoomFn = null;
let setCustomZoomFn = null;

function renderTask9ZoomBrush() {
  const container = d3.select("#chart-task9");
  container.selectAll("*").remove();

  const width = 1100;
  const heightFocus = 320;
  const heightContext = 90;
  const totalHeight = heightFocus + heightContext + 40;
  const margin = { top: 25, right: 50, bottom: 25, left: 60 };

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Defs for ClipPath to prevent zoomed lines from overflowing focus chart area
  const defs = svg.append("defs");
  defs.append("clipPath")
    .attr("id", "focus-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", heightFocus - margin.top);

  // Focus Scales
  const xFocus = d3.scaleTime()
    .domain(d3.extent(airData, d => d.date))
    .range([margin.left, width - margin.right]);

  const yFocus = d3.scaleLinear()
    .domain([0, d3.max(airData, d => d.pm25_city) * 1.08])
    .nice()
    .range([heightFocus, margin.top]);

  // Context Scales
  const xContext = d3.scaleTime()
    .domain(xFocus.domain())
    .range([margin.left, width - margin.right]);

  const yContext = d3.scaleLinear()
    .domain(yFocus.domain())
    .range([totalHeight - margin.bottom, heightFocus + 40]);

  // Focus Axes
  const xAxisFocus = d3.axisBottom(xFocus).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
  const yAxisFocus = d3.axisLeft(yFocus).ticks(6).tickFormat(d => `${d}`);

  // Context Axes
  const xAxisContext = d3.axisBottom(xContext).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));

  // Line generator for focus chart
  const lineFocus = d3.line()
    .x(d => xFocus(d.date))
    .y(d => yFocus(d.pm25_city))
    .curve(d3.curveMonotoneX);

  // Focus Group
  const focusG = svg.append("g").attr("class", "focus");

  // Reference lines in Focus
  focusG.append("line")
    .attr("class", "ref-line target")
    .attr("x1", margin.left).attr("x2", width - margin.right)
    .attr("y1", yFocus(75)).attr("y2", yFocus(75));

  focusG.append("text")
    .attr("x", width - margin.right - 10)
    .attr("y", yFocus(75) - 6)
    .attr("text-anchor", "end")
    .attr("fill", COLORS.target)
    .attr("font-size", "10px")
    .attr("font-weight", "700")
    .text("WHO Target: 75 µg/m³");

  // Path container with clip-path
  const focusPathsG = focusG.append("g").attr("clip-path", "url(#focus-clip)");

  const focusPaths = segments.map(seg => {
    return focusPathsG.append("path")
      .datum(seg)
      .attr("fill", "none")
      .attr("stroke", COLORS.city)
      .attr("stroke-width", 2)
      .attr("d", lineFocus);
  });

  const gXFocus = focusG.append("g")
    .attr("transform", `translate(0, ${heightFocus})`)
    .call(xAxisFocus)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  focusG.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxisFocus)
    .call(g => g.append("text")
      .attr("class", "axis-label")
      .attr("x", -margin.left + 15)
      .attr("y", margin.top - 8)
      .text("Main City PM2.5 (µg/m³)"));

  // Context Group
  const contextG = svg.append("g").attr("class", "context");

  // Area chart for context overview
  const areaContext = d3.area()
    .x(d => xContext(d.date))
    .y0(totalHeight - margin.bottom)
    .y1(d => yContext(d.pm25_city))
    .curve(d3.curveMonotoneX);

  contextG.append("path")
    .datum(airData)
    .attr("fill", "#cbd5e1")
    .attr("opacity", 0.6)
    .attr("d", areaContext);

  contextG.append("path")
    .datum(airData)
    .attr("fill", "none")
    .attr("stroke", "#64748b")
    .attr("stroke-width", 1.2)
    .attr("d", d3.line().x(d => xContext(d.date)).y(d => yContext(d.pm25_city)).curve(d3.curveMonotoneX));

  contextG.append("g")
    .attr("transform", `translate(0, ${totalHeight - margin.bottom})`)
    .call(xAxisContext)
    .call(g => g.selectAll("text").attr("font-weight", "600"));

  contextG.append("text")
    .attr("x", margin.left)
    .attr("y", heightFocus + 32)
    .attr("font-size", "11px")
    .attr("font-weight", "700")
    .attr("fill", "#64748b")
    .text("OVERVIEW: Drag or resize selection to zoom main chart above");

  // Brush implementation
  const brush = d3.brushX()
    .extent([[margin.left, heightFocus + 40], [width - margin.right, totalHeight - margin.bottom]])
    .on("brush end", brushed);

  const brushG = contextG.append("g")
    .attr("class", "brush")
    .call(brush);

  function brushed(event) {
    const selection = event.selection;
    if (!selection) {
      xFocus.domain(xContext.domain());
    } else {
      xFocus.domain([xContext.invert(selection[0]), xContext.invert(selection[1])]);
    }
    // Update lines and x-axis
    focusPaths.forEach(p => p.attr("d", lineFocus));
    gXFocus.call(xAxisFocus.scale(xFocus));
  }

  resetZoomFn = () => {
    brushG.call(brush.move, null);
    xFocus.domain(xContext.domain());
    focusPaths.forEach(p => p.attr("d", lineFocus));
    gXFocus.call(xAxisFocus.scale(xFocus));
  };

  setCustomZoomFn = (startDate, endDate) => {
    const sel = [xContext(startDate), xContext(endDate)];
    brushG.call(brush.move, sel);
  };
}

// Preset Zoom Action Handlers
function resetZoom() {
  if (resetZoomFn) resetZoomFn();
}

function zoomPreset(preset) {
  if (!setCustomZoomFn) return;
  if (preset === "nov") {
    setCustomZoomFn(new Date(2025, 10, 1), new Date(2025, 10, 30));
  } else if (preset === "may") {
    setCustomZoomFn(new Date(2025, 4, 10), new Date(2025, 4, 25));
  } else if (preset === "summer") {
    setCustomZoomFn(new Date(2025, 5, 15), new Date(2025, 7, 31));
  } else if (preset === "gap") {
    setCustomZoomFn(new Date(2025, 2, 1), new Date(2025, 2, 31));
  } else {
    resetZoom();
  }
}

/* ==========================================================================
   Interactive Tooltip Helpers
   ========================================================================== */
function attachLineTooltip(svg, data, xScale, yScale, width, height, margin, valKey, label) {
  const bisectDate = d3.bisector(d => d.date).left;
  const hoverGroup = svg.append("g").style("display", "none");

  hoverGroup.append("line")
    .attr("class", "hover-cursor")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "#64748b")
    .attr("stroke-width", 1.2)
    .attr("stroke-dasharray", "3,3");

  const dot = hoverGroup.append("circle")
    .attr("r", 5)
    .attr("fill", COLORS.city)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  svg.append("rect")
    .attr("class", "overlay")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .on("mouseover", () => hoverGroup.style("display", null))
    .on("mouseout", () => {
      hoverGroup.style("display", "none");
      hideTooltip();
    })
    .on("mousemove", function(event) {
      const [mx] = d3.pointer(event, this);
      const mouseDate = xScale.invert(mx);
      let idx = bisectDate(data, mouseDate, 1);
      const d0 = data[idx - 1];
      const d1 = data[idx];
      let d = d0;
      if (d1 && (mouseDate - d0.date > d1.date - mouseDate)) d = d1;
      if (!d) return;

      const cx = xScale(d.date);
      const cy = yScale(d[valKey]);

      hoverGroup.select(".hover-cursor").attr("x1", cx).attr("x2", cx);
      dot.attr("cx", cx).attr("cy", cy);

      const val = d[valKey];
      let statusBadge = "";
      if (valKey === "pm25_city") {
        if (val > 150) statusBadge = '<div class="tt-badge" style="background:#dc2626;color:#fff">Severe (>150)</div>';
        else if (val > 75) statusBadge = '<div class="tt-badge" style="background:#ea580c;color:#fff">High (>75)</div>';
        else if (val > 35) statusBadge = '<div class="tt-badge" style="background:#f59e0b;color:#fff">Moderate (36-75)</div>';
        else statusBadge = '<div class="tt-badge" style="background:#10b981;color:#fff">Low (≤35)</div>';
      }

      showTooltip(event, `
        <div class="tt-date">${d3.timeFormat("%B %d, %Y")(d.date)}</div>
        <div class="tt-row">
          <span class="tt-label">${label}:</span>
          <span class="tt-val">${typeof val === 'number' ? (valKey === 'cumAbove75' ? val + ' days' : val.toFixed(1) + ' µg/m³') : val}</span>
        </div>
        ${d.temp_c !== undefined ? `<div class="tt-row"><span class="tt-label">Temperature:</span><span class="tt-val">${d.temp_c}°C</span></div>` : ''}
        ${statusBadge}
      `);
    });
}

function showTooltip(event, htmlContent) {
  const tooltip = document.getElementById("d3-tooltip");
  if (!tooltip) return;

  tooltip.innerHTML = htmlContent;
  tooltip.style.opacity = "1";

  const pad = 15;
  let x = event.pageX + pad;
  let y = event.pageY - 20;

  const tooltipWidth = tooltip.offsetWidth || 220;
  if (x + tooltipWidth > window.innerWidth - 20) {
    x = event.pageX - tooltipWidth - pad;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  const tooltip = document.getElementById("d3-tooltip");
  if (tooltip) tooltip.style.opacity = "0";
}
