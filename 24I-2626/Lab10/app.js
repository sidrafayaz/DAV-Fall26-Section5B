// --- Set up Dimensions ---
const margin = {top: 40, right: 30, bottom: 40, left: 50},
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

// --- Load and Parse Data ---
const parseTime = d3.timeParse("%Y-%m-%d");

d3.csv("air_quality_2025.csv", d3.autoType).then(function(data) {
    // d3.autoType already parsed the dates and numbers for us!
    
    // Move straight to Task 1...

    // ==========================================
    // TASK 1: Row Count & Missing Dates
    // ==========================================
    const firstDate = data[0].date;
    const lastDate = data[data.length - 1].date;
    // d3.timeDay.count finds calendar days between two dates
    const expectedDays = d3.timeDay.count(firstDate, lastDate) + 1; 
    const missingDays = expectedDays - data.length;

    d3.select("#task1-stats").html(`
        <p>Total Rows: ${data.length}</p>
        <p>First Date: ${d3.timeFormat("%b %d, %Y")(firstDate)} | Last Date: ${d3.timeFormat("%b %d, %Y")(lastDate)}</p>
        <p>Missing Days: ${missingDays}</p>
    `);

    // ==========================================
    // TASK 2: City PM2.5 Line Chart with Thresholds
    // ==========================================
    const svg2 = d3.select("#task2-line-chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X and Y Scales using d3.scaleTime and d3.scaleLinear
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width]);
      
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.pm25_city) + 20])
      .range([height, 0]);

    // Add Axes
    svg2.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    svg2.append("g")
      .call(d3.axisLeft(y));

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.pm25_city));

    svg2.append("path")
      .datum(data)
      .attr("class", "line-city")
      .attr("d", line);

    // Add Reference Lines (15 and 75)
    [15, 75].forEach(val => {
        svg2.append("line")
            .attr("class", "reference-line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", y(val)).attr("y2", y(val));
            
        svg2.append("text")
            .attr("x", width - 5)
            .attr("y", y(val) - 5)
            .attr("text-anchor", "end")
            .style("fill", "red")
            .text(`${val} µg/m³ target`);
    });


    // ==========================================
    // TASK 3: Area Chart (Running Total > 75)
    // ==========================================
    // Calculate the running total of days > 75 µg/m³
    let unhealthyCount = 0;
    const runningTotalData = data.map(d => {
        if (d.pm25_city > 75) unhealthyCount++;
        return { date: d.date, runningTotal: unhealthyCount };
    });

    const svg3 = d3.select("#task3-area-chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const y3 = d3.scaleLinear()
      .domain([0, d3.max(runningTotalData, d => d.runningTotal)])
      .range([height, 0]);

    svg3.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
      
    svg3.append("g")
      .call(d3.axisLeft(y3));

    // Draw the Area Chart
    const area = d3.area()
      .x(d => x(d.date))
      .y0(height) // Bottom of the area
      .y1(d => y3(d.runningTotal)); // Top of the area

    svg3.append("path")
      .datum(runningTotalData)
      .attr("fill", "lightcoral")
      .attr("d", area);

    // ==========================================
    // TASK 4: Multi-line Chart (City vs Suburb)
    // ==========================================
    const svg4 = d3.select("#task4-multi-line")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // We can reuse the 'x' and 'y' scales from Task 2 since the domains are similar,
    // but let's make sure the y-domain covers the max of BOTH city and suburb.
    const maxPM25 = d3.max(data, d => Math.max(d.pm25_city, d.pm25_suburb));
    const y4 = d3.scaleLinear()
      .domain([0, maxPM25 + 20])
      .range([height, 0]);

    svg4.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
      
    svg4.append("g")
      .call(d3.axisLeft(y4));

    // City Line
    const lineCity = d3.line()
      .defined(d => !isNaN(d.pm25_city))
      .x(d => x(d.date))
      .y(d => y4(d.pm25_city));

    // Suburb Line
    const lineSuburb = d3.line()
      .defined(d => !isNaN(d.pm25_suburb))
      .x(d => x(d.date))
      .y(d => y4(d.pm25_suburb));

    svg4.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", lineCity);

    svg4.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 2)
      .attr("d", lineSuburb);

    // Legend
    svg4.append("circle").attr("cx", 20).attr("cy", 10).attr("r", 6).style("fill", "steelblue");
    svg4.append("text").attr("x", 35).attr("y", 15).text("City Center").style("font-size", "14px");
    svg4.append("circle").attr("cx", 140).attr("cy", 10).attr("r", 6).style("fill", "orange");
    svg4.append("text").attr("x", 155).attr("y", 15).text("Suburb").style("font-size", "14px");

    // ==========================================
    // TASK 5: Stacked Bar Chart (Composition)
    // ==========================================
    const levels = ["Low", "Moderate", "High", "Severe"];
    const colors = ["#90EE90", "#FFD700", "#FF8C00", "#B22222"]; // Light to dark
    const colorScale = d3.scaleOrdinal().domain(levels).range(colors);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Assign levels to each day
    const categorized = data.map(d => {
        let level = "Severe";
        if (d.pm25_city <= 35) level = "Low";
        else if (d.pm25_city <= 75) level = "Moderate";
        else if (d.pm25_city <= 150) level = "High";
        return { month: d.date.getMonth(), level: level };
    });

    // 2. Group by month and level, then format for d3.stack
    const monthlyCounts = Array.from({length: 12}, (_, i) => ({ month: i, Low: 0, Moderate: 0, High: 0, Severe: 0 }));
    categorized.forEach(d => {
        monthlyCounts[d.month][d.level]++;
    });

    const stack = d3.stack().keys(levels)(monthlyCounts);

    const svg5 = d3.select("#task5-stacked-chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x5 = d3.scaleBand()
        .domain(monthlyCounts.map(d => monthNames[d.month]))
        .range([0, width])
        .padding(0.2);

    const y5 = d3.scaleLinear()
        .domain([0, 31]) // Max days in a month
        .range([height, 0]);

    svg5.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x5));
    svg5.append("g").call(d3.axisLeft(y5));

    // Draw stacked bars
    svg5.selectAll("g.layer")
        .data(stack)
        .enter().append("g")
        .classed("layer", true)
        .attr("fill", d => colorScale(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x5(monthNames[d.data.month]))
        .attr("y", d => y5(d[1]))
        .attr("height", d => y5(d[0]) - y5(d[1]))
        .attr("width", x5.bandwidth());

    // ==========================================
    // TASK 6: Heatmap (Day of Week vs Month)
    // ==========================================
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Group by month and weekday, calculate mean PM2.5
    const heatmapData = d3.rollups(data, 
        v => d3.mean(v, d => d.pm25_city), 
        d => d.date.getMonth(), 
        d => d.date.getDay()
    );

    // Flatten data for D3 drawing
    const flatHeatmapData = [];
    heatmapData.forEach(([month, days]) => {
        days.forEach(([day, avg]) => {
            flatHeatmapData.push({ month: month, day: day, avg: avg });
        });
    });

    const svg6 = d3.select("#task6-heatmap")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left + 20},${margin.top})`);

    const x6 = d3.scaleBand()
        .domain(d3.range(12))
        .range([0, width - 20])
        .padding(0.05);

    const y6 = d3.scaleBand()
        .domain(d3.range(7))
        .range([0, height])
        .padding(0.05);

    const colorHeatmap = d3.scaleSequential(d3.interpolateYlOrRd)
        .domain([0, d3.max(flatHeatmapData, d => d.avg)]);

    // Axes
    svg6.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x6).tickFormat(d => monthNames[d]));
    svg6.append("g")
        .call(d3.axisLeft(y6).tickFormat(d => weekdays[d]));

    // Draw cells
    svg6.selectAll("rect")
        .data(flatHeatmapData)
        .enter().append("rect")
        .attr("x", d => x6(d.month))
        .attr("y", d => y6(d.day))
        .attr("width", x6.bandwidth())
        .attr("height", y6.bandwidth())
        .style("fill", d => colorHeatmap(d.avg));


    // ==========================================
    // TASK 7: Band Chart (Monthly Spread)
    // ==========================================
    // Group by month and calculate min, max, mean
    const monthlyStats = d3.rollups(data,
        v => ({
            min: d3.min(v, d => d.pm25_city),
            max: d3.max(v, d => d.pm25_city),
            mean: d3.mean(v, d => d.pm25_city)
        }),
        d => d.date.getMonth()
    ).map(d => ({ month: d[0], ...d[1] }));

    const svg7 = d3.select("#task7-band-chart")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x7 = d3.scaleBand()
        .domain(monthlyStats.map(d => monthNames[d.month]))
        .range([0, width])
        .padding(0.1);

    const y7 = d3.scaleLinear()
        .domain([0, d3.max(monthlyStats, d => d.max) + 20])
        .range([height, 0]);

    svg7.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x7));
    svg7.append("g").call(d3.axisLeft(y7));

    // Draw the shaded area (Min to Max)
    svg7.selectAll(".band")
        .data(monthlyStats)
        .enter().append("rect")
        .attr("class", "band")
        .attr("x", d => x7(monthNames[d.month]))
        .attr("y", d => y7(d.max))
        .attr("width", x7.bandwidth())
        .attr("height", d => y7(d.min) - y7(d.max))
        .attr("fill", "lightgray")
        .attr("opacity", 0.5);

    // Draw the Mean line segments across each band
    svg7.selectAll(".mean-line")
        .data(monthlyStats)
        .enter().append("line")
        .attr("class", "mean-line")
        .attr("x1", d => x7(monthNames[d.month]))
        .attr("x2", d => x7(monthNames[d.month]) + x7.bandwidth())
        .attr("y1", d => y7(d.mean))
        .attr("y2", d => y7(d.mean))
        .attr("stroke", "darkred")
        .attr("stroke-width", 3);

    // ==========================================
    // TASK 8: 7-Day Moving Average & Gap Handling
    // ==========================================
    // Use a string formatter to safely match dates regardless of browser timezone
    const formatDate = d3.timeFormat("%Y-%m-%d");
    const dateMap = new Map(data.map(d => [formatDate(d.date), d.pm25_city]));
    const fullDateRange = d3.timeDays(firstDate, d3.timeDay.offset(lastDate, 1));
    
    const paddedData = fullDateRange.map(date => ({
        date: date,
        pm25_city: dateMap.has(formatDate(date)) ? dateMap.get(formatDate(date)) : null
    }));

    // Calculate 7-day moving average
    paddedData.forEach((d, i) => {
        if (d.pm25_city === null) {
            d.movingAvg = null;
        } else {
            const start = Math.max(0, i - 6);
            const windowData = paddedData.slice(start, i + 1).filter(w => w.pm25_city !== null);
            d.movingAvg = d3.mean(windowData, w => w.pm25_city);
        }
    });

    const svg8 = d3.select("#task8-moving-avg")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg8.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    svg8.append("g").call(d3.axisLeft(y));

    // Shade the missing data gap (March 12 - March 20)
    const gapStart = parseTime("2025-03-11");
    const gapEnd = parseTime("2025-03-21");
    svg8.append("rect")
        .attr("x", x(gapStart))
        .attr("y", 0)
        .attr("width", x(gapEnd) - x(gapStart))
        .attr("height", height)
        .attr("class", "missing-data-gap")
        .attr("opacity", 0.3);
        
    svg8.append("text")
        .attr("x", x(gapStart) + 5)
        .attr("y", 20)
        .text("No data: sensor offline (9 days)")
        .style("font-size", "12px")
        .style("fill", "gray");

    // Thin line for daily values
    const lineDaily = d3.line()
        .defined(d => d.pm25_city !== null)
        .x(d => x(d.date))
        .y(d => y(d.pm25_city));

    // Thick line for moving average
    const lineAvg = d3.line()
        .defined(d => d.movingAvg !== null)
        .x(d => x(d.date))
        .y(d => y(d.movingAvg));

    svg8.append("path").datum(paddedData).attr("fill", "none").attr("stroke", "lightblue").attr("stroke-width", 1).attr("d", lineDaily);
    svg8.append("path").datum(paddedData).attr("fill", "none").attr("stroke", "darkblue").attr("stroke-width", 3).attr("d", lineAvg);

    // ==========================================
    // TASK 9: Zoomable / Brushable Line Chart
    // ==========================================
    const svg9 = d3.select("#task9-zoom")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 60) // Extra height for brush context
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add Reset Button
    d3.select("#task9-zoom")
      .insert("button", "svg")
      .text("Reset Zoom")
      .on("click", () => {
          x9.domain(d3.extent(data, d => d.date));
          xAxis9.transition().duration(1000).call(d3.axisBottom(x9));
          mainLinePath.transition().duration(1000).attr("d", line9);
          context.select(".brush").call(brush.move, null);
      });

    const x9 = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, width]);
    const xContext = d3.scaleTime().domain(x9.domain()).range([0, width]);
    const y9 = d3.scaleLinear().domain([0, d3.max(data, d => d.pm25_city)]).range([height - 50, 0]);
    const yContext = d3.scaleLinear().domain(y9.domain()).range([40, 0]);

    const xAxis9 = svg9.append("g").attr("transform", `translate(0,${height - 50})`).call(d3.axisBottom(x9));
    svg9.append("g").call(d3.axisLeft(y9));

    // Main Line
    const line9 = d3.line().defined(d => !isNaN(d.pm25_city)).x(d => x9(d.date)).y(d => y9(d.pm25_city));
    const mainLinePath = svg9.append("path").datum(data).attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2).attr("d", line9);

    // Context (Brush) area
    const context = svg9.append("g").attr("transform", `translate(0,${height})`);
    const lineContext = d3.line().defined(d => !isNaN(d.pm25_city)).x(d => xContext(d.date)).y(d => yContext(d.pm25_city));
    
    context.append("path").datum(data).attr("fill", "none").attr("stroke", "gray").attr("d", lineContext);
    context.append("g").attr("transform", "translate(0,40)").call(d3.axisBottom(xContext));

    // Brush functionality
    const brush = d3.brushX()
        .extent([[0, 0], [width, 40]])
        .on("brush end", brushed);

    context.append("g")
        .attr("class", "brush")
        .call(brush);

    function brushed(event) {
        const selection = event.selection;
        if (selection) {
            x9.domain(selection.map(xContext.invert, xContext));
            xAxis9.call(d3.axisBottom(x9));
            mainLinePath.attr("d", line9);
        }
    }
});