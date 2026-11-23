// Lab 10: Time Series Data Visualization in D3.js
// Roll Number: 24i-2551

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%Y-%m-%d");
const formatShortDate = d3.timeFormat("%d %b");
const formatMonth = d3.timeFormat("%b");

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Shared tooltip element
const tooltip = d3.select("#tooltip");

function showTooltip(event, htmlContent) {
  tooltip
    .style("opacity", 1)
    .html(htmlContent)
    .style("left", (event.pageX + 12) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

// Load and prepare data
d3.csv("air_quality_2025.csv").then(rawRows => {
  const data = rawRows.map(d => {
    const dt = parseDate(d.date);
    const dowIndex = (dt.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
    return {
      dateStr: d.date,
      date: dt,
      pm25_city: +d.pm25_city,
      pm25_suburb: +d.pm25_suburb,
      temp_c: +d.temp_c,
      monthIndex: dt.getMonth(),
      monthName: MONTH_NAMES[dt.getMonth()],
      dowIndex: dowIndex,
      dowName: DOW_NAMES[dowIndex]
    };
  }).sort((a, b) => a.date - b.date);

  renderTask1(data);
  renderTask2(data);
  renderTask3(data);
  renderTask4(data);
  renderTask5(data);
  renderTask6(data);
  renderTask7(data);
  renderTask8(data);
  renderTask9(data);
});

// ============================================================================
// TASK 1: Count rows, first & last dates, compare with 365 days in 2025
// ============================================================================
function renderTask1(data) {
  const rowCount = data.length;
  const firstDate = formatDate(data[0].date);
  const lastDate = formatDate(data[data.length - 1].date);
  const daysIn2025 = 365;
  const missingDaysTotal = daysIn2025 - rowCount;

  // Detect specific date gaps using d3.timeDay.count
  const gaps = [];
  for (let i = 1; i < data.length; i++) {
    const diff = d3.timeDay.count(data[i - 1].date, data[i].date);
    if (diff > 1) {
      gaps.push({
        before: data[i - 1].date,
        after: data[i].date,
        missingCount: diff - 1,
        firstMissing: d3.timeDay.offset(data[i - 1].date, 1),
        lastMissing: d3.timeDay.offset(data[i].date, -1)
      });
    }
  }

  const gapText = gaps.map(g =>
    `${g.missingCount} days missing between ${formatDate(g.before)} and ${formatDate(g.after)} (${formatDate(g.firstMissing)} to ${formatDate(g.lastMissing)})`
  ).join("; ");

  d3.select("#task1-summary").html(`
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-label">Recorded Rows</div>
        <div class="stat-value">${rowCount}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Calendar Days in 2025</div>
        <div class="stat-value">${daysIn2025}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">First Date</div>
        <div class="stat-value">${firstDate}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Last Date</div>
        <div class="stat-value">${lastDate}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Missing Days</div>
        <div class="stat-value highlight-warn">${missingDaysTotal} days</div>
      </div>
    </div>
    <p class="task-note">
      <strong>Observation:</strong> Although the dataset starts on <code>${firstDate}</code> and ends on <code>${lastDate}</code>, it has <strong>${rowCount} rows</strong> instead of <strong>${daysIn2025} days</strong>. Using <code>d3.timeDay.count(prev, curr)</code> reveals a single sensor outage: <strong>${gapText}</strong>, leaving March with only 22 recorded days instead of 31.
    </p>
  `);
}

// ============================================================================
// TASK 2: Daily City PM2.5 Line Chart + Reference Lines (15, 75) + Top 2 Spikes
// ============================================================================
function renderTask2(data) {
  const daysAbove15 = data.filter(d => d.pm25_city > 15).length;
  const daysAbove75 = data.filter(d => d.pm25_city > 75).length;
  const pct15 = ((daysAbove15 / data.length) * 100).toFixed(1);
  const pct75 = ((daysAbove75 / data.length) * 100).toFixed(1);

  d3.select("#task2-subtitle").html(
    `Days above 15 µg/m³ (WHO Guideline): <strong>${daysAbove15}</strong> (${pct15}% of recorded days) &nbsp;|&nbsp; ` +
    `Days above 75 µg/m³ (Interim Target 1): <strong>${daysAbove75}</strong> (${pct75}% of recorded days)`
  );

  const width = 820, height = 320;
  const margin = { top: 28, right: 35, bottom: 38, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select("#chart-task2")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.pm25_city) * 1.1])
    .nice()
    .range([innerH, 0]);

  // Gridlines
  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));

  // Axes
  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6));

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("PM2.5 (µg/m³)");

  // Main daily line
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.pm25_city));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 1.6)
    .attr("d", line);

  // Dashed reference lines at 15 and 75 µg/m³
  const refs = [
    { val: 15, label: "WHO Guideline (15 µg/m³)", color: "#16a34a" },
    { val: 75, label: "WHO Interim Target 1 (75 µg/m³)", color: "#dc2626" }
  ];

  refs.forEach(ref => {
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", y(ref.val))
      .attr("y2", y(ref.val))
      .attr("stroke", ref.color)
      .attr("stroke-width", 1.3)
      .attr("stroke-dasharray", "5,4");

    g.append("text")
      .attr("x", innerW - 4)
      .attr("y", y(ref.val) - 5)
      .attr("text-anchor", "end")
      .attr("fill", ref.color)
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(ref.label);
  });

  // Two highest days
  const top2 = [...data].sort((a, b) => b.pm25_city - a.pm25_city).slice(0, 2);

  top2.forEach((d, idx) => {
    g.append("circle")
      .attr("cx", x(d.date))
      .attr("cy", y(d.pm25_city))
      .attr("r", 4.5)
      .attr("fill", "#dc2626")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    const xOffset = idx === 0 ? -10 : 8;
    const anchor = idx === 0 ? "end" : "start";

    g.append("text")
      .attr("x", x(d.date) + xOffset)
      .attr("y", y(d.pm25_city) + 4)
      .attr("text-anchor", anchor)
      .attr("fill", "#991b1b")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(`${d.dateStr}: ${d.pm25_city.toFixed(1)} µg/m³`);
  });

  // Interactive hover with d3.bisector
  const bisectDate = d3.bisector(d => d.date).center;
  const focusDot = g.append("circle")
    .attr("r", 4)
    .attr("fill", "#1d4ed8")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("display", "none");

  g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const hoveredDate = x.invert(mx);
      const i = bisectDate(data, hoveredDate);
      const d = data[i];
      focusDot
        .style("display", null)
        .attr("cx", x(d.date))
        .attr("cy", y(d.pm25_city));
      showTooltip(event, `<strong>${d.dateStr}</strong><br/>City PM2.5: <strong>${d.pm25_city.toFixed(1)} µg/m³</strong><br/>Temp: ${d.temp_c.toFixed(1)} °C`);
    })
    .on("mouseleave", () => {
      focusDot.style("display", "none");
      hideTooltip();
    });
}

// ============================================================================
// TASK 3: Running Total of Unhealthy Days (> 75 µg/m³) Area Chart (d3.cumsum)
// ============================================================================
function renderTask3(data) {
  const runningTotals = d3.cumsum(data, d => d.pm25_city > 75 ? 1 : 0);
  const cumData = data.map((d, i) => ({
    date: d.date,
    dateStr: d.dateStr,
    pm25_city: d.pm25_city,
    cumDays: runningTotals[i]
  }));

  const finalCount = cumData[cumData.length - 1].cumDays;
  d3.select("#task3-subtitle").html(
    `Running total calculated with <code>d3.cumsum</code>. Final cumulative total on 2025-12-31: <strong>${finalCount} days</strong> (matches Task 2 count of 188 days).`
  );

  const width = 820, height = 290;
  const margin = { top: 24, right: 75, bottom: 38, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select("#chart-task3")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(cumData, d => d.date))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, 200])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(5));

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("Cumulative Days > 75 µg/m³");

  const area = d3.area()
    .x(d => x(d.date))
    .y0(innerH)
    .y1(d => y(d.cumDays));

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.cumDays));

  g.append("path")
    .datum(cumData)
    .attr("fill", "#bfdbfe")
    .attr("fill-opacity", 0.65)
    .attr("d", area);

  g.append("path")
    .datum(cumData)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 2.2)
    .attr("d", line);

  // Label final point
  const lastPt = cumData[cumData.length - 1];
  g.append("circle")
    .attr("cx", x(lastPt.date))
    .attr("cy", y(lastPt.cumDays))
    .attr("r", 4.5)
    .attr("fill", "#2563eb");

  g.append("text")
    .attr("x", x(lastPt.date) + 7)
    .attr("y", y(lastPt.cumDays) + 4)
    .attr("fill", "#1e40af")
    .attr("font-size", "11.5px")
    .attr("font-weight", "600")
    .text(`${lastPt.cumDays} days`);

  // Annotation for flat summer period
  const julPt = cumData.find(d => d.dateStr === "2025-07-15");
  if (julPt) {
    g.append("text")
      .attr("x", x(julPt.date))
      .attr("y", y(julPt.cumDays) - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#475569")
      .attr("font-size", "11px")
      .text("Flat plateau (Jun–Aug: 0 days > 75)");
  }

  // Hover interaction
  const bisectDate = d3.bisector(d => d.date).center;
  const focusDot = g.append("circle")
    .attr("r", 4)
    .attr("fill", "#1e40af")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("display", "none");

  g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const d = cumData[bisectDate(cumData, x.invert(mx))];
      focusDot
        .style("display", null)
        .attr("cx", x(d.date))
        .attr("cy", y(d.cumDays));
      showTooltip(event, `<strong>${d.dateStr}</strong><br/>Cumulative Days > 75: <strong>${d.cumDays}</strong><br/>Day's PM2.5: ${d.pm25_city.toFixed(1)} µg/m³`);
    })
    .on("mouseleave", () => {
      focusDot.style("display", "none");
      hideTooltip();
    });
}

// ============================================================================
// TASK 4: Multi-line Chart — City Centre vs Suburb PM2.5
// ============================================================================
function renderTask4(data) {
  const width = 820, height = 310;
  const margin = { top: 24, right: 35, bottom: 38, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select("#chart-task4")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => Math.max(d.pm25_city, d.pm25_suburb)) * 1.08])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6));

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("PM2.5 (µg/m³)");

  const lineCity = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.pm25_city));

  const lineSuburb = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.pm25_suburb));

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 1.6)
    .attr("d", lineCity);

  g.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#ea580c")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.9)
    .attr("d", lineSuburb);

  // Interactive hover
  const bisectDate = d3.bisector(d => d.date).center;
  const hoverLine = g.append("line")
    .attr("y1", 0)
    .attr("y2", innerH)
    .attr("stroke", "#94a3b8")
    .attr("stroke-dasharray", "3,3")
    .style("display", "none");

  const dotCity = g.append("circle").attr("r", 4).attr("fill", "#2563eb").style("display", "none");
  const dotSub = g.append("circle").attr("r", 4).attr("fill", "#ea580c").style("display", "none");

  g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const d = data[bisectDate(data, x.invert(mx))];
      hoverLine.style("display", null).attr("x1", x(d.date)).attr("x2", x(d.date));
      dotCity.style("display", null).attr("cx", x(d.date)).attr("cy", y(d.pm25_city));
      dotSub.style("display", null).attr("cx", x(d.date)).attr("cy", y(d.pm25_suburb));
      const diff = (d.pm25_city - d.pm25_suburb).toFixed(1);
      showTooltip(
        event,
        `<strong>${d.dateStr}</strong><br/>` +
        `City Centre: <strong>${d.pm25_city.toFixed(1)} µg/m³</strong><br/>` +
        `Suburb: <strong>${d.pm25_suburb.toFixed(1)} µg/m³</strong><br/>` +
        `Difference (City - Suburb): ${diff} µg/m³`
      );
    })
    .on("mouseleave", () => {
      hoverLine.style("display", "none");
      dotCity.style("display", "none");
      dotSub.style("display", "none");
      hideTooltip();
    });
}

// ============================================================================
// TASK 5: Monthly Split by Pollution Levels (d3.rollup + d3.stack)
// Supports both Stacked Bar and Stacked Area views
// ============================================================================
function renderTask5(data) {
  const levels = ["Low", "Moderate", "High", "Severe"];
  const levelColors = {
    Low: "#dbeafe",
    Moderate: "#60a5fa",
    High: "#2563eb",
    Severe: "#1e3a8a"
  };

  function classifyLevel(val) {
    if (val <= 35) return "Low";
    if (val <= 75) return "Moderate";
    if (val <= 150) return "High";
    return "Severe";
  }

  // Group counts per month & level using d3.rollup
  const rolled = d3.rollup(
    data,
    v => v.length,
    d => d.monthIndex,
    d => classifyLevel(d.pm25_city)
  );

  const monthlyCounts = MONTH_NAMES.map((mName, idx) => {
    const levelMap = rolled.get(idx) || new Map();
    const obj = {
      monthIndex: idx,
      month: mName,
      Low: levelMap.get("Low") || 0,
      Moderate: levelMap.get("Moderate") || 0,
      High: levelMap.get("High") || 0,
      Severe: levelMap.get("Severe") || 0
    };
    obj.total = obj.Low + obj.Moderate + obj.High + obj.Severe;
    return obj;
  });

  const stackedSeries = d3.stack().keys(levels)(monthlyCounts);

  const width = 820, height = 310;
  const margin = { top: 24, right: 35, bottom: 38, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const container = d3.select("#chart-task5");

  function drawChart(mode) {
    container.selectAll("*").remove();

    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleLinear()
      .domain([0, 32])
      .range([innerH, 0]);

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));

    g.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(y).ticks(6));

    g.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .text("Number of Days");

    if (mode === "bar") {
      const x = d3.scaleBand()
        .domain(MONTH_NAMES)
        .range([0, innerW])
        .padding(0.22);

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x));

      const layerGroups = g.selectAll(".layer")
        .data(stackedSeries)
        .join("g")
        .attr("class", "layer")
        .attr("fill", d => levelColors[d.key]);

      layerGroups.selectAll("rect")
        .data(d => d.map(item => ({ key: d.key, ...item })))
        .join("rect")
        .attr("x", d => x(d.data.month))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.5)
        .on("mousemove", (event, d) => {
          const count = d[1] - d[0];
          showTooltip(
            event,
            `<strong>${d.data.month} 2025</strong> (Total recorded: ${d.data.total} days)<br/>` +
            `${d.key}: <strong>${count} days</strong><br/>` +
            `<small>Low: ${d.data.Low}, Mod: ${d.data.Moderate}, High: ${d.data.High}, Sev: ${d.data.Severe}</small>`
          );
        })
        .on("mouseleave", hideTooltip);

      // Total days label above each stack
      g.selectAll(".total-label")
        .data(monthlyCounts)
        .join("text")
        .attr("x", d => x(d.month) + x.bandwidth() / 2)
        .attr("y", d => y(d.total) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10.5px")
        .attr("fill", d => d.month === "Mar" ? "#dc2626" : "#475569")
        .attr("font-weight", d => d.month === "Mar" ? "700" : "500")
        .text(d => d.total);
    } else {
      const x = d3.scalePoint()
        .domain(MONTH_NAMES)
        .range([0, innerW]);

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x));

      const areaGen = d3.area()
        .x(d => x(d.data.month))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

      g.selectAll(".area-layer")
        .data(stackedSeries)
        .join("path")
        .attr("class", "area-layer")
        .attr("fill", d => levelColors[d.key])
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 0.8)
        .attr("d", areaGen);

      // Interactive points for month hover
      g.selectAll(".month-col")
        .data(monthlyCounts)
        .join("rect")
        .attr("x", d => x(d.month) - (innerW / 24))
        .attr("y", 0)
        .attr("width", innerW / 12)
        .attr("height", innerH)
        .attr("fill", "transparent")
        .on("mousemove", (event, d) => {
          showTooltip(
            event,
            `<strong>${d.month} 2025</strong> (Total: ${d.total} days)<br/>` +
            `Severe (>150): <strong>${d.Severe}</strong><br/>` +
            `High (76–150): <strong>${d.High}</strong><br/>` +
            `Moderate (36–75): <strong>${d.Moderate}</strong><br/>` +
            `Low (≤35): <strong>${d.Low}</strong>`
          );
        })
        .on("mouseleave", hideTooltip);
    }
  }

  drawChart("bar");

  d3.selectAll(".task5-toggle").on("click", function () {
    const mode = d3.select(this).attr("data-mode");
    d3.selectAll(".task5-toggle").classed("active", false);
    d3.select(this).classed("active", true);
    drawChart(mode);
  });
}

// ============================================================================
// TASK 6: Month x Day-of-Week Heatmap (d3.rollup + d3.scaleBand + d3.scaleSequential)
// ============================================================================
function renderTask6(data) {
  // Average city PM2.5 for every (monthName, dowName) combination
  const rolled = d3.rollup(
    data,
    v => d3.mean(v, d => d.pm25_city),
    d => d.monthName,
    d => d.dowName
  );

  const cells = [];
  MONTH_NAMES.forEach(m => {
    DOW_NAMES.forEach(dow => {
      const val = rolled.get(m)?.get(dow) || 0;
      cells.push({ month: m, dow: dow, avg: val });
    });
  });

  const width = 820, height = 300;
  const margin = { top: 20, right: 35, bottom: 58, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select("#chart-task6")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(MONTH_NAMES)
    .range([0, innerW])
    .padding(0.06);

  const y = d3.scaleBand()
    .domain(DOW_NAMES)
    .range([0, innerH])
    .padding(0.08);

  const maxAvg = d3.max(cells, d => d.avg);
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, maxAvg]);

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  // Draw heatmap cells
  g.selectAll("rect.cell")
    .data(cells)
    .join("rect")
    .attr("class", "cell")
    .attr("x", d => x(d.month))
    .attr("y", d => y(d.dow))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("rx", 3)
    .attr("fill", d => colorScale(d.avg))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mousemove", (event, d) => {
      showTooltip(
        event,
        `<strong>${d.month} — ${d.dow}</strong><br/>Average PM2.5: <strong>${d.avg.toFixed(1)} µg/m³</strong>`
      );
    })
    .on("mouseleave", hideTooltip);

  // Add cell text values for quick reading
  g.selectAll("text.cell-val")
    .data(cells)
    .join("text")
    .attr("class", "cell-val")
    .attr("x", d => x(d.month) + x.bandwidth() / 2)
    .attr("y", d => y(d.dow) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .attr("font-size", "9.5px")
    .attr("fill", d => d.avg > 115 ? "#ffffff" : "#1e293b")
    .attr("pointer-events", "none")
    .text(d => Math.round(d.avg));

  // Colour Legend at bottom
  const legendW = 240, legendH = 10;
  const legendG = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${height - 22})`);

  const defs = svg.append("defs");
  const grad = defs.append("linearGradient")
    .attr("id", "heatmap-grad")
    .attr("x1", "0%").attr("x2", "100%")
    .attr("y1", "0%").attr("y2", "0%");

  d3.range(0, 1.01, 0.1).forEach(t => {
    grad.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(t * maxAvg));
  });

  legendG.append("text")
    .attr("x", 0)
    .attr("y", 9)
    .attr("font-size", "11px")
    .attr("fill", "#475569")
    .text("0 µg/m³");

  legendG.append("rect")
    .attr("x", 48)
    .attr("y", 0)
    .attr("width", legendW)
    .attr("height", legendH)
    .attr("rx", 2)
    .attr("fill", "url(#heatmap-grad)");

  legendG.append("text")
    .attr("x", 48 + legendW + 6)
    .attr("y", 9)
    .attr("font-size", "11px")
    .attr("fill", "#475569")
    .text(`${Math.round(maxAvg)} µg/m³ (Mean City PM2.5)`);
}

// ============================================================================
// TASK 7: Monthly Band Chart — Min, Max, and Mean City PM2.5
// ============================================================================
function renderTask7(data) {
  const monthlyStats = Array.from(
    d3.rollup(
      data,
      v => ({
        min: d3.min(v, d => d.pm25_city),
        max: d3.max(v, d => d.pm25_city),
        mean: d3.mean(v, d => d.pm25_city),
        minDate: v.reduce((a, b) => a.pm25_city < b.pm25_city ? a : b).dateStr,
        maxDate: v.reduce((a, b) => a.pm25_city > b.pm25_city ? a : b).dateStr
      }),
      d => d.monthIndex
    ),
    ([monthIndex, stats]) => ({
      monthIndex,
      month: MONTH_NAMES[monthIndex],
      ...stats,
      spread: stats.max - stats.min
    })
  ).sort((a, b) => a.monthIndex - b.monthIndex);

  const width = 820, height = 310;
  const margin = { top: 26, right: 35, bottom: 38, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select("#chart-task7")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint()
    .domain(MONTH_NAMES)
    .range([0, innerW])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(monthlyStats, d => d.max) * 1.08])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6));

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("PM2.5 (µg/m³)");

  // Shaded band between min and max
  const bandArea = d3.area()
    .x(d => x(d.month))
    .y0(d => y(d.min))
    .y1(d => y(d.max));

  g.append("path")
    .datum(monthlyStats)
    .attr("fill", "#fed7aa")
    .attr("fill-opacity", 0.7)
    .attr("stroke", "#fb923c")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,2")
    .attr("d", bandArea);

  // Mean line through the band
  const meanLine = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.mean));

  g.append("path")
    .datum(monthlyStats)
    .attr("fill", "none")
    .attr("stroke", "#c2410c")
    .attr("stroke-width", 2.4)
    .attr("d", meanLine);

  // Dots on mean line + interactive hover
  g.selectAll("circle.mean-dot")
    .data(monthlyStats)
    .join("circle")
    .attr("class", "mean-dot")
    .attr("cx", d => x(d.month))
    .attr("cy", d => y(d.mean))
    .attr("r", 4)
    .attr("fill", "#c2410c")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.2);

  // Annotate widest spread (Nov: 239.1 µg/m³)
  const widest = monthlyStats.reduce((a, b) => a.spread > b.spread ? a : b);
  g.append("text")
    .attr("x", x(widest.month) - 8)
    .attr("y", y(widest.max) + 4)
    .attr("text-anchor", "end")
    .attr("font-size", "11px")
    .attr("font-weight", "600")
    .attr("fill", "#9a3412")
    .text(`Widest spread: ${widest.month} (Range: ${widest.spread.toFixed(1)} µg/m³)`);

  // Hover columns
  g.selectAll(".band-hover")
    .data(monthlyStats)
    .join("rect")
    .attr("x", d => x(d.month) - 24)
    .attr("y", 0)
    .attr("width", 48)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", (event, d) => {
      showTooltip(
        event,
        `<strong>${d.month} 2025</strong><br/>` +
        `Max (Worst): <strong>${d.max.toFixed(1)} µg/m³</strong> (${d.maxDate})<br/>` +
        `Mean: <strong>${d.mean.toFixed(1)} µg/m³</strong><br/>` +
        `Min (Best): <strong>${d.min.toFixed(1)} µg/m³</strong> (${d.minDate})<br/>` +
        `Spread (Max - Min): <strong>${d.spread.toFixed(1)} µg/m³</strong>`
      );
    })
    .on("mouseleave", hideTooltip);
}

// ============================================================================
// TASK 8: 7-Day Moving Average + Broken Line at Missing Data Gap
// ============================================================================
function renderTask8(data) {
  // Build a continuous calendar series (or insert null sentinel at gap) so d3.line().defined()
  // breaks the line cleanly at the gap and the 7-day average never averages across the gap.
  const fullSeries = [];
  let gapInfo = null;

  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      const dayDiff = d3.timeDay.count(data[i - 1].date, data[i].date);
      if (dayDiff > 1) {
        gapInfo = {
          start: data[i - 1].date,
          end: data[i].date,
          startStr: data[i - 1].dateStr,
          endStr: data[i].dateStr,
          missingDays: dayDiff - 1
        };
        // Insert a gap marker to break both daily and moving average lines
        fullSeries.push({
          date: d3.timeDay.offset(data[i - 1].date, 1),
          pm25_city: null,
          ma7: null,
          isGap: true
        });
      }
    }

    // Calculate 7-day moving average ONLY if the previous 6 days are consecutive (no gap in window)
    let ma7 = null;
    if (i >= 6) {
      const spanDays = d3.timeDay.count(data[i - 6].date, data[i].date);
      if (spanDays === 6) {
        const windowSlice = data.slice(i - 6, i + 1);
        ma7 = d3.mean(windowSlice, d => d.pm25_city);
      }
    }

    fullSeries.push({
      ...data[i],
      ma7: ma7,
      isGap: false
    });
  }

  d3.select("#task8-subtitle").html(
    `Sensor outage note: <strong>${gapInfo.missingDays} missing days</strong> between <code>${gapInfo.startStr}</code> and <code>${gapInfo.endStr}</code> (12 Mar – 20 Mar 2025). Both the daily line and 7-day moving average break across the gap without averaging across it.`
  );

  const width = 820, height = 320;
  const margin = { top: 26, right: 35, bottom: 38, left: 52 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select("#chart-task8")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.pm25_city) * 1.08])
    .nice()
    .range([innerH, 0]);

  g.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(""));

  // Shade the missing data gap
  if (gapInfo) {
    const gx1 = x(gapInfo.start);
    const gx2 = x(gapInfo.end);
    g.append("rect")
      .attr("x", gx1)
      .attr("y", 0)
      .attr("width", Math.max(4, gx2 - gx1))
      .attr("height", innerH)
      .attr("fill", "#fee2e2")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    g.append("text")
      .attr("x", (gx1 + gx2) / 2 + 6)
      .attr("y", 18)
      .attr("text-anchor", "start")
      .attr("fill", "#b91c1c")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .text(`← No data: sensor offline (${gapInfo.missingDays} days missing)`);
  }

  g.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6));

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("PM2.5 (µg/m³)");

  // Thin, faint daily line (broken at gap)
  const dailyLine = d3.line()
    .defined(d => !d.isGap && d.pm25_city !== null)
    .x(d => x(d.date))
    .y(d => y(d.pm25_city));

  g.append("path")
    .datum(fullSeries)
    .attr("fill", "none")
    .attr("stroke", "#93c5fd")
    .attr("stroke-width", 1.1)
    .attr("d", dailyLine);

  // Thick, dark 7-day moving average line (broken at gap, not averaged across gap)
  const maLine = d3.line()
    .defined(d => !d.isGap && d.ma7 !== null)
    .x(d => x(d.date))
    .y(d => y(d.ma7));

  g.append("path")
    .datum(fullSeries)
    .attr("fill", "none")
    .attr("stroke", "#1e3a8a")
    .attr("stroke-width", 2.4)
    .attr("d", maLine);

  // Hover tooltip
  const bisectDate = d3.bisector(d => d.date).center;
  g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const d = data[bisectDate(data, x.invert(mx))];
      const match = fullSeries.find(item => !item.isGap && item.dateStr === d.dateStr);
      const maText = match && match.ma7 !== null ? `${match.ma7.toFixed(1)} µg/m³` : "N/A (< 7 consecutive days)";
      showTooltip(
        event,
        `<strong>${d.dateStr}</strong><br/>` +
        `Daily PM2.5: <strong>${d.pm25_city.toFixed(1)} µg/m³</strong><br/>` +
        `7-Day Moving Avg: <strong>${maText}</strong>`
      );
    })
    .on("mouseleave", hideTooltip);
}

// ============================================================================
// TASK 9: Brushable Overview + Zoomable Main Line Chart + Reset Button
// ============================================================================
function renderTask9(data) {
  const width = 820;
  const mainHeight = 250;
  const contextHeight = 75;
  const totalHeight = mainHeight + contextHeight + 55;

  const marginMain = { top: 20, right: 35, bottom: 30, left: 52 };
  const marginCtx = { top: mainHeight + 28, right: 35, bottom: 22, left: 52 };
  const innerW = width - marginMain.left - marginMain.right;
  const innerHMain = mainHeight - marginMain.top - marginMain.bottom;
  const innerHCtx = contextHeight - 15;

  const svg = d3.select("#chart-task9")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${totalHeight}`);

  svg.append("defs")
    .append("clipPath")
    .attr("id", "clip-task9")
    .append("rect")
    .attr("width", innerW)
    .attr("height", innerHMain);

  const fullDomain = d3.extent(data, d => d.date);

  const xMain = d3.scaleTime().domain(fullDomain).range([0, innerW]);
  const xCtx = d3.scaleTime().domain(fullDomain).range([0, innerW]);

  const yMain = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.pm25_city) * 1.08])
    .nice()
    .range([innerHMain, 0]);

  const yCtx = d3.scaleLinear()
    .domain(yMain.domain())
    .range([innerHCtx, 0]);

  const gMain = svg.append("g")
    .attr("transform", `translate(${marginMain.left},${marginMain.top})`);

  const gCtx = svg.append("g")
    .attr("transform", `translate(${marginCtx.left},${marginCtx.top})`);

  // Grid & Axes for Main
  gMain.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(yMain).ticks(5).tickSize(-innerW).tickFormat(""));

  const xAxisMainG = gMain.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHMain})`)
    .call(d3.axisBottom(xMain).ticks(8));

  gMain.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(yMain).ticks(5));

  gMain.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHMain / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .text("PM2.5 (µg/m³)");

  const lineMain = d3.line()
    .x(d => xMain(d.date))
    .y(d => yMain(d.pm25_city));

  const mainChartBody = gMain.append("g")
    .attr("clip-path", "url(#clip-task9)");

  const mainPath = mainChartBody.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 1.8)
    .attr("d", lineMain);

  const mainDots = mainChartBody.selectAll("circle.pt")
    .data(data)
    .join("circle")
    .attr("class", "pt")
    .attr("cx", d => xMain(d.date))
    .attr("cy", d => yMain(d.pm25_city))
    .attr("r", 2.2)
    .attr("fill", "#1d4ed8")
    .attr("opacity", 0.65);

  // Hover on main chart
  const bisectDate = d3.bisector(d => d.date).center;
  gMain.append("rect")
    .attr("width", innerW)
    .attr("height", innerHMain)
    .attr("fill", "transparent")
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const d = data[bisectDate(data, xMain.invert(mx))];
      showTooltip(
        event,
        `<strong>${d.dateStr}</strong><br/>City PM2.5: <strong>${d.pm25_city.toFixed(1)} µg/m³</strong><br/>Suburb PM2.5: ${d.pm25_suburb.toFixed(1)} µg/m³`
      );
    })
    .on("mouseleave", hideTooltip);

  // Overview Context Chart
  const areaCtx = d3.area()
    .x(d => xCtx(d.date))
    .y0(innerHCtx)
    .y1(d => yCtx(d.pm25_city));

  gCtx.append("path")
    .datum(data)
    .attr("fill", "#dbeafe")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 1.2)
    .attr("d", areaCtx);

  gCtx.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${innerHCtx})`)
    .call(d3.axisBottom(xCtx).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

  const brush = d3.brushX()
    .extent([[0, 0], [innerW, innerHCtx]])
    .on("brush end", brushed);

  const brushG = gCtx.append("g")
    .attr("class", "brush")
    .call(brush);

  function brushed(event) {
    if (event.selection) {
      const [x0, x1] = event.selection.map(xCtx.invert);
      xMain.domain([x0, x1]);
      d3.select("#task9-range-label").text(`Showing: ${formatShortDate(x0)} 2025 to ${formatShortDate(x1)} 2025`);
    } else {
      xMain.domain(fullDomain);
      d3.select("#task9-range-label").text("Showing: Full Year (01 Jan 2025 to 31 Dec 2025)");
    }
    xAxisMainG.call(d3.axisBottom(xMain).ticks(8));
    mainPath.attr("d", lineMain);
    mainDots
      .attr("cx", d => xMain(d.date))
      .attr("cy", d => yMain(d.pm25_city));
  }

  // Reset button
  d3.select("#btn-reset-zoom").on("click", () => {
    brushG.call(brush.move, null);
  });

  // Quick Zoom to November (widest spread month for Director Question 10)
  d3.select("#btn-zoom-nov").on("click", () => {
    const novStart = parseDate("2025-11-01");
    const novEnd = parseDate("2025-11-30");
    brushG.call(brush.move, [xCtx(novStart), xCtx(novEnd)]);
  });
}

