/**
 * FAST-NUCES Islamabad — Data Analysis and Visualization
 * Lab 10: Time Series Visualization with D3.js
 * Student: i242548_DSB
 * 
 * Implements Tasks 1 through 9:
 * Task 1: Data Audit & Row Discrepancy
 * Task 2: City Centre PM2.5 Line Chart with WHO Reference Lines & Top 2 Peaks
 * Task 3: Cumulative Unhealthy Days (>75 µg/m³) Filled Area Chart
 * Task 4: City vs. Suburb Multi-Line Comparison Chart
 * Task 5: Monthly Pollution Levels Stacked Bar Chart
 * Task 6: Day-of-Week × Month Pollution Heatmap Grid
 * Task 7: Monthly Spread (Min / Max / Mean) Band Chart
 * Task 8: 7-Day Moving Average with Broken Line at Missing Sensor Gap
 * Task 9: Focus + Context Interactive Brush & Zoom Line Chart
 */

document.addEventListener("DOMContentLoaded", () => {
    const tooltip = d3.select("#tooltip");

    // Embedded CSV Data fallback so the page works standalone even without a local web server
    const EMBEDDED_CSV = `date,pm25_city,pm25_suburb,temp_c
2025-01-01,105.8,80.4,10.0
2025-01-02,145.3,152.1,11.3
2025-01-03,132.7,104.5,10.8
2025-01-04,133.7,110.3,5.7
2025-01-05,136.4,111.2,13.8
2025-01-06,150.2,121.6,10.2
2025-01-07,163.3,151.1,16.3
2025-01-08,135.2,93.6,8.1
2025-01-09,107.0,102.0,9.6
2025-01-10,123.2,100.5,13.2
2025-01-11,189.3,156.9,10.0
2025-01-12,121.2,108.4,11.7
2025-01-13,134.6,129.0,8.7
2025-01-14,119.3,90.9,14.0
2025-01-15,155.5,112.0,10.9
2025-01-16,102.4,71.6,11.1
2025-01-17,105.3,77.2,14.6
2025-01-18,93.3,69.6,14.4
2025-01-19,117.0,90.4,12.1
2025-01-20,175.3,129.2,14.5
2025-01-21,132.1,98.6,12.2
2025-01-22,196.6,166.3,14.2
2025-01-23,138.6,96.5,13.8
2025-01-24,111.7,80.3,11.9
2025-01-25,111.4,94.7,13.1
2025-01-26,173.3,121.7,13.1
2025-01-27,135.5,101.8,13.6
2025-01-28,161.2,114.1,14.3
2025-01-29,145.3,107.6,16.2
2025-01-30,145.8,118.9,14.7
2025-01-31,166.6,152.3,13.6
2025-02-01,108.1,90.5,13.3
2025-02-02,99.5,70.7,16.9
2025-02-03,218.4,178.5,17.5
2025-02-04,144.7,111.4,12.8
2025-02-05,139.6,95.5,16.2
2025-02-06,156.1,108.3,13.4
2025-02-07,129.1,110.8,13.5
2025-02-08,118.7,84.4,13.3
2025-02-09,150.8,120.4,15.8
2025-02-10,165.1,127.5,12.4
2025-02-11,136.8,101.5,13.9
2025-02-12,114.7,106.8,20.4
2025-02-13,120.0,100.7,15.0
2025-02-14,156.0,116.5,15.6
2025-02-15,95.2,80.0,18.1
2025-02-16,139.0,114.4,14.0
2025-02-17,186.0,177.0,17.6
2025-02-18,149.5,117.1,15.4
2025-02-19,102.4,78.5,18.0
2025-02-20,117.6,83.2,17.0
2025-02-21,142.9,102.8,18.5
2025-02-22,114.9,84.9,16.9
2025-02-23,144.1,126.1,16.0
2025-02-24,237.8,157.3,17.8
2025-02-25,133.0,88.7,16.9
2025-02-26,122.5,88.0,20.2
2025-02-27,187.2,131.7,15.2
2025-02-28,142.6,104.3,17.7
2025-03-01,122.0,115.0,20.3
2025-03-02,104.3,99.6,22.4
2025-03-03,97.0,69.4,19.8
2025-03-04,143.9,109.8,17.8
2025-03-05,149.8,120.0,18.5
2025-03-06,144.7,104.3,17.5
2025-03-07,129.6,99.3,20.7
2025-03-08,110.0,87.6,18.3
2025-03-09,95.9,75.4,19.3
2025-03-10,91.2,58.1,19.0
2025-03-11,162.9,157.7,21.0
2025-03-21,144.0,119.4,20.4
2025-03-22,79.9,64.4,23.8
2025-03-23,104.6,91.8,22.6
2025-03-24,121.1,103.5,22.7
2025-03-25,103.8,103.7,22.0
2025-03-26,102.1,77.7,24.9
2025-03-27,143.7,96.5,19.9
2025-03-28,111.1,90.6,23.4
2025-03-29,51.1,42.0,24.3
2025-03-30,94.8,70.9,22.5
2025-03-31,117.5,91.8,21.6
2025-04-01,126.0,120.3,24.6
2025-04-02,115.4,85.0,23.8
2025-04-03,135.0,106.4,19.9
2025-04-04,78.1,54.9,25.7
2025-04-05,67.4,44.0,21.7
2025-04-06,58.0,50.6,25.5
2025-04-07,104.5,81.1,24.8
2025-04-08,81.3,58.2,25.3
2025-04-09,85.2,66.0,25.9
2025-04-10,75.8,62.8,26.4
2025-04-11,108.7,101.8,28.1
2025-04-12,99.2,74.0,28.3
2025-04-13,71.7,54.0,27.9
2025-04-14,64.7,47.8,22.6
2025-04-15,78.7,58.7,26.7
2025-04-16,86.8,55.3,26.3
2025-04-17,109.0,92.2,25.4
2025-04-18,74.3,66.1,29.4
2025-04-19,60.9,54.8,26.2
2025-04-20,62.3,46.8,27.0
2025-04-21,79.7,60.6,26.3
2025-04-22,81.9,77.0,27.1
2025-04-23,67.7,64.0,28.3
2025-04-24,68.9,59.5,27.2
2025-04-25,76.0,54.7,29.2
2025-04-26,85.1,65.8,31.7
2025-04-27,70.1,59.3,26.1
2025-04-28,62.1,51.0,28.9
2025-04-29,67.1,46.7,29.4
2025-04-30,76.9,61.6,26.3
2025-05-01,62.6,50.5,28.7
2025-05-02,77.9,60.9,29.8
2025-05-03,48.4,35.9,28.4
2025-05-04,70.0,51.9,30.2
2025-05-05,55.3,36.5,31.5
2025-05-06,46.5,37.3,31.2
2025-05-07,70.5,60.4,32.8
2025-05-08,44.0,40.4,30.8
2025-05-09,52.4,53.3,31.1
2025-05-10,56.3,48.6,26.7
2025-05-11,57.0,41.7,32.7
2025-05-12,72.7,51.4,30.7
2025-05-13,46.4,37.6,32.8
2025-05-14,72.7,51.1,30.5
2025-05-15,65.0,54.9,28.7
2025-05-16,64.9,56.1,34.6
2025-05-17,50.9,44.7,33.3
2025-05-18,245,210,32.4
2025-05-19,55.3,45.3,30.6
2025-05-20,39.0,32.5,26.9
2025-05-21,44.8,32.8,30.5
2025-05-22,40.2,26.3,31.3
2025-05-23,42.5,33.3,32.4
2025-05-24,44.1,38.2,29.4
2025-05-25,67.3,56.6,32.4
2025-05-26,44.2,34.9,36.3
2025-05-27,43.5,35.0,29.9
2025-05-28,62.9,49.8,31.1
2025-05-29,44.9,39.7,34.0
2025-05-30,39.7,23.9,30.7
2025-05-31,31.4,27.1,33.3
2025-06-01,50.3,35.9,33.7
2025-06-02,35.7,28.3,31.1
2025-06-03,39.1,31.1,33.8
2025-06-04,24.5,20.4,31.5
2025-06-05,33.0,28.1,35.5
2025-06-06,29.2,24.4,31.6
2025-06-07,37.1,33.6,33.3
2025-06-08,40.7,33.6,33.9
2025-06-09,48.4,36.1,28.8
2025-06-10,30.2,23.7,33.2
2025-06-11,30.3,23.1,38.2
2025-06-12,41.0,34.5,30.7
2025-06-13,28.8,22.0,34.3
2025-06-14,35.1,27.4,32.1
2025-06-15,38.8,29.9,31.3
2025-06-16,24.0,16.6,36.2
2025-06-17,39.1,34.3,36.2
2025-06-18,41.7,37.8,37.1
2025-06-19,23.9,21.2,32.7
2025-06-20,35.3,34.4,33.6
2025-06-21,25.2,20.9,33.7
2025-06-22,26.3,22.1,32.1
2025-06-23,29.2,24.6,37.2
2025-06-24,32.9,29.0,34.4
2025-06-25,31.0,22.6,33.1
2025-06-26,35.8,29.0,33.4
2025-06-27,24.9,19.1,33.3
2025-06-28,28.4,22.2,33.9
2025-06-29,18.0,13.4,34.5
2025-06-30,24.2,18.5,35.7
2025-07-01,37.3,27.5,31.7
2025-07-02,26.9,23.1,33.9
2025-07-03,28.5,22.1,30.8
2025-07-04,25.1,18.4,31.0
2025-07-05,20.9,13.9,31.7
2025-07-06,30.9,25.1,35.1
2025-07-07,28.2,23.3,32.4
2025-07-08,29.1,24.3,33.3
2025-07-09,11.8,11.4,30.7
2025-07-10,19.1,17.6,33.4
2025-07-11,25.2,20.3,34.2
2025-07-12,34.1,30.0,32.2
2025-07-13,18.4,14.9,28.7
2025-07-14,26.1,20.7,34.3
2025-07-15,30.1,27.7,34.5
2025-07-16,28.8,21.2,29.2
2025-07-17,30.6,24.5,31.8
2025-07-18,33.4,26.3,36.0
2025-07-19,23.7,19.8,31.6
2025-07-20,17.1,10.9,32.3
2025-07-21,33.4,24.1,32.9
2025-07-22,28.2,23.5,31.4
2025-07-23,28.4,23.5,29.3
2025-07-24,48.9,36.3,31.9
2025-07-25,26.9,24.5,32.0
2025-07-26,21.1,16.9,31.4
2025-07-27,19.8,16.7,29.8
2025-07-28,16.8,13.0,31.3
2025-07-29,37.1,30.5,33.3
2025-07-30,32.9,29.9,30.5
2025-07-31,20.9,15.6,29.5
2025-08-01,25.5,17.3,30.3
2025-08-02,29.6,24.3,27.9
2025-08-03,23.4,19.1,32.8
2025-08-04,27.7,21.7,27.1
2025-08-05,20.7,17.3,30.9
2025-08-06,26.8,23.9,33.4
2025-08-07,49.0,31.8,34.9
2025-08-08,28.2,22.0,27.6
2025-08-09,22.0,15.8,27.2
2025-08-10,27.5,26.6,33.9
2025-08-11,40.2,36.6,29.6
2025-08-12,42.3,33.6,29.5
2025-08-13,38.1,29.9,31.8
2025-08-14,34.1,26.5,29.6
2025-08-15,34.5,26.8,26.1
2025-08-16,24.7,19.4,25.6
2025-08-17,43.6,36.1,27.0
2025-08-18,36.0,35.4,27.9
2025-08-19,41.6,36.8,28.4
2025-08-20,40.8,33.5,29.6
2025-08-21,38.9,34.2,27.7
2025-08-22,43.1,34.0,30.9
2025-08-23,41.0,31.9,28.6
2025-08-24,37.3,35.7,28.4
2025-08-25,39.1,31.6,30.0
2025-08-26,40.5,37.0,25.9
2025-08-27,39.3,33.2,24.5
2025-08-28,52.2,43.5,27.0
2025-08-29,69.0,62.7,24.3
2025-08-30,42.6,34.0,26.0
2025-08-31,44.3,33.7,27.2
2025-09-01,52.9,42.3,26.4
2025-09-02,45.5,35.6,26.7
2025-09-03,69.3,57.5,23.8
2025-09-04,44.7,33.4,24.8
2025-09-05,51.1,46.4,27.0
2025-09-06,48.4,29.7,24.5
2025-09-07,33.8,28.9,24.5
2025-09-08,57.3,45.1,23.3
2025-09-09,48.2,31.0,24.2
2025-09-10,58.7,53.7,26.5
2025-09-11,59.1,44.1,22.7
2025-09-12,76.7,55.2,23.8
2025-09-13,36.0,27.7,26.9
2025-09-14,42.8,35.0,19.4
2025-09-15,48.1,40.1,21.5
2025-09-16,81.5,64.5,21.3
2025-09-17,40.5,31.9,22.3
2025-09-18,55.2,36.8,19.9
2025-09-19,83.1,73.6,25.9
2025-09-20,74.1,59.5,20.4
2025-09-21,81.3,52.7,22.9
2025-09-22,58.6,51.6,21.0
2025-09-23,83.9,81.8,24.0
2025-09-24,79.0,78.2,21.1
2025-09-25,46.9,36.5,24.6
2025-09-26,41.8,44.7,21.4
2025-09-27,65.0,48.0,20.4
2025-09-28,94.8,77.4,20.7
2025-09-29,54.1,40.3,17.0
2025-09-30,73.8,54.7,18.3
2025-10-01,62.3,47.8,18.1
2025-10-02,95.4,78.5,20.4
2025-10-03,94.6,70.6,21.6
2025-10-04,63.1,43.4,16.2
2025-10-05,82.0,77.3,18.9
2025-10-06,62.0,44.8,18.9
2025-10-07,69.2,62.3,18.5
2025-10-08,73.3,66.5,18.6
2025-10-09,77.1,54.5,19.4
2025-10-10,95.4,79.3,19.5
2025-10-11,67.0,62.1,16.3
2025-10-12,77.4,62.5,19.2
2025-10-13,65.0,56.6,19.5
2025-10-14,77.4,55.8,15.5
2025-10-15,72.7,50.4,19.4
2025-10-16,74.6,60.7,18.6
2025-10-17,87.8,62.9,14.4
2025-10-18,68.0,49.7,13.8
2025-10-19,87.9,69.9,16.9
2025-10-20,70.6,54.0,17.4
2025-10-21,92.9,71.6,17.2
2025-10-22,100.4,75.1,15.8
2025-10-23,98.1,73.9,14.8
2025-10-24,86.5,79.2,16.6
2025-10-25,117.7,96.6,15.3
2025-10-26,78.7,61.3,17.5
2025-10-27,78.1,60.8,18.4
2025-10-28,150.1,124.4,14.9
2025-10-29,162.7,158.9,14.1
2025-10-30,96.9,66.3,13.7
2025-10-31,132.8,94.6,13.3
2025-11-01,145.7,117.9,12.5
2025-11-02,80.9,59.2,12.9
2025-11-03,97.3,84.1,12.7
2025-11-04,129.0,93.0,12.1
2025-11-05,110.8,86.7,12.1
2025-11-06,109.3,90.0,14.3
2025-11-07,155.9,134.1,13.9
2025-11-08,320,290,14.3
2025-11-09,115.0,92.5,15.6
2025-11-10,144.4,117.3,15.1
2025-11-11,143.7,114.6,12.9
2025-11-12,121.3,91.9,14.6
2025-11-13,109.9,72.8,12.1
2025-11-14,112.4,74.7,14.9
2025-11-15,142.1,123.2,14.3
2025-11-16,104.9,82.3,14.1
2025-11-17,83.5,57.8,11.1
2025-11-18,150.6,104.4,14.0
2025-11-19,114.1,79.2,12.1
2025-11-20,175.5,131.2,11.5
2025-11-21,102.0,83.8,10.8
2025-11-22,123.2,91.0,14.9
2025-11-23,107.1,84.1,11.6
2025-11-24,139.3,108.0,15.7
2025-11-25,151.4,125.6,12.0
2025-11-26,86.6,66.4,11.2
2025-11-27,119.1,107.0,9.7
2025-11-28,146.7,150.4,7.8
2025-11-29,89.6,77.4,10.0
2025-11-30,138.9,116.0,11.1
2025-12-01,149.1,127.2,6.6
2025-12-02,106.4,81.4,10.5
2025-12-03,118.4,90.2,13.4
2025-12-04,166.5,139.7,15.1
2025-12-05,176.4,142.1,13.8
2025-12-06,78.7,49.6,3.6
2025-12-07,88.1,66.0,10.0
2025-12-08,155.2,123.7,14.1
2025-12-09,134.6,114.9,11.8
2025-12-10,123.8,128.4,6.8
2025-12-11,104.3,77.1,13.9
2025-12-12,173.2,160.6,13.1
2025-12-13,156.6,133.4,11.3
2025-12-14,110.6,81.8,11.6
2025-12-15,110.2,84.7,10.3
2025-12-16,183.7,138.4,18.0
2025-12-17,156.0,131.2,12.2
2025-12-18,143.2,107.5,10.6
2025-12-19,102.0,73.1,10.1
2025-12-20,139.3,129.7,8.7
2025-12-21,109.4,91.1,14.9
2025-12-22,138.3,88.0,13.9
2025-12-23,150.6,121.1,10.2
2025-12-24,105.2,81.9,5.8
2025-12-25,124.1,108.5,10.6
2025-12-26,190.4,164.1,9.3
2025-12-27,118.8,103.3,9.5
2025-12-28,144.4,116.8,13.9
2025-12-29,199.2,150.7,9.2
2025-12-30,127.2,107.2,12.5
2025-12-31,219.3,173.4,9.2
`;

    // Try fetching external file first; if CORS or 404 occurs, cleanly use embedded data
    const dataPromise = d3.csv("air_quality_2025.csv")
        .then(res => (res && res.length > 0) ? res : d3.csvParse(EMBEDDED_CSV))
        .catch(() => d3.csvParse(EMBEDDED_CSV));

    dataPromise.then(rawData => {
        // Parse dates and numbers
        const parseDate = d3.timeParse("%Y-%m-%d");
        const formatDate = d3.timeFormat("%Y-%m-%d");
        const formatDisplay = d3.timeFormat("%b %d, %Y");
        const formatShort = d3.timeFormat("%d %b");
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        const data = rawData.map(d => ({
            dateStr: d.date,
            date: parseDate(d.date),
            pm25_city: +d.pm25_city,
            pm25_suburb: +d.pm25_suburb,
            temp_c: +d.temp_c
        })).sort((a, b) => a.date - b.date);

        // Run all task renderers
        renderTask1(data);
        renderTask2(data, formatDisplay, formatShort);
        renderTask3(data, formatDisplay, formatShort);
        renderTask4(data, formatDisplay, formatShort);
        renderTask5(data, monthNames, monthShortNames);
        renderTask6(data, monthShortNames, weekdayNames);
        renderTask7(data, monthShortNames);
        renderTask8(data, formatDisplay, formatShort);
        renderTask9(data, formatDisplay, formatShort);

    }).catch(err => {
        console.error("Error loading air_quality_2025.csv:", err);
        const container = document.querySelector(".container");
        if (container) {
            const errDiv = document.createElement("div");
            errDiv.style.background = "#fee2e2";
            errDiv.style.color = "#b91c1c";
            errDiv.style.padding = "20px";
            errDiv.style.borderRadius = "8px";
            errDiv.style.marginTop = "20px";
            errDiv.innerHTML = `<h3>Data Loading Error</h3><p>Could not load <code>air_quality_2025.csv</code>. Please make sure you are serving this project via a local web server (e.g. VS Code Live Server) so that CSV fetch is permitted.</p><p>Error: ${err.message}</p>`;
            container.prepend(errDiv);
        }
    });

    // ===================================================================
    // TASK 1: Data Audit & Gap Identification
    // ===================================================================
    function renderTask1(data) {
        const rowCount = data.length;
        const firstDate = data[0].dateStr;
        const lastDate = data[data.length - 1].dateStr;
        const daysIn2025 = 365;
        const missingCount = daysIn2025 - rowCount;

        // Find missing dates
        const dateSet = new Set(data.map(d => d.dateStr));
        const missingDates = [];
        const cur = new Date(2025, 0, 1);
        const end = new Date(2025, 11, 31);
        while (cur <= end) {
            const y = cur.getFullYear();
            const m = String(cur.getMonth() + 1).padStart(2, '0');
            const day = String(cur.getDate()).padStart(2, '0');
            const str = `${y}-${m}-${day}`;
            if (!dateSet.has(str)) {
                missingDates.push(str);
            }
            cur.setDate(cur.getDate() + 1);
        }

        const tableContainer = document.getElementById("task1-audit-table");
        if (tableContainer) {
            tableContainer.innerHTML = `
                <table class="audit-table">
                    <thead>
                        <tr>
                            <th>Audit Check</th>
                            <th>Observed Value</th>
                            <th>Expected Value</th>
                            <th>Discrepancy / Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Row Count</strong></td>
                            <td>${rowCount} rows</td>
                            <td>365 days (2025 non-leap)</td>
                            <td><span class="badge-status fail">${missingCount} Days Missing</span></td>
                        </tr>
                        <tr>
                            <td><strong>First Date</strong></td>
                            <td>${firstDate} (Jan 1, 2025)</td>
                            <td>2025-01-01</td>
                            <td><span class="badge-status pass">Matches Year Start</span></td>
                        </tr>
                        <tr>
                            <td><strong>Last Date</strong></td>
                            <td>${lastDate} (Dec 31, 2025)</td>
                            <td>2025-12-31</td>
                            <td><span class="badge-status pass">Matches Year End</span></td>
                        </tr>
                        <tr>
                            <td><strong>Missing Date Interval</strong></td>
                            <td>${missingDates[0]} to ${missingDates[missingDates.length - 1]} (${missingDates.length} consecutive days)</td>
                            <td>Continuous unbroken time series</td>
                            <td><span class="badge-status warn">Sensor Outage (March 12–20)</span></td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
    }

    // ===================================================================
    // TASK 2: City Centre PM2.5 Line Chart
    // ===================================================================
    function renderTask2(data, formatDisplay, formatShort) {
        const container = d3.select("#task2-chart");
        container.selectAll("*").remove();

        const margin = { top: 30, right: 120, bottom: 40, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain([new Date(2025, 0, 1), new Date(2025, 11, 31)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, 350])
            .nice()
            .range([height, 0]);

        // Grid lines
        svg.append("g")
            .attr("class", "grid-line")
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        // X Axis
        svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

        // Y Axis
        svg.append("g")
            .attr("class", "axis y-axis")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("PM2.5 Concentration (µg/m³)");

        // Dashed reference line: WHO 15 µg/m³
        svg.append("line")
            .attr("class", "ref-line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", y(15)).attr("y2", y(15))
            .attr("stroke", "#16a34a")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,4");

        svg.append("text")
            .attr("class", "ref-label")
            .attr("x", width + 8)
            .attr("y", y(15) + 4)
            .attr("fill", "#16a34a")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .text("WHO Guideline (15 µg/m³)");

        // Dashed reference line: WHO 75 µg/m³
        svg.append("line")
            .attr("class", "ref-line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", y(75)).attr("y2", y(75))
            .attr("stroke", "#ea580c")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,4");

        svg.append("text")
            .attr("class", "ref-label")
            .attr("x", width + 8)
            .attr("y", y(75) + 4)
            .attr("fill", "#ea580c")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .text("WHO Target 1 (75 µg/m³)");

        // City PM2.5 Line
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.pm25_city));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#dc2626")
            .attr("stroke-width", 1.8)
            .attr("d", line);

        // Find top 2 highest days
        const sorted = [...data].sort((a, b) => b.pm25_city - a.pm25_city);
        const top2 = sorted.slice(0, 2);

        top2.forEach((pt, idx) => {
            // Pulse circle
            svg.append("circle")
                .attr("cx", x(pt.date))
                .attr("cy", y(pt.pm25_city))
                .attr("r", 6)
                .attr("fill", "#dc2626")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2);

            // Callout line & text
            const yOffset = idx === 0 ? -24 : -18;
            const xOffset = idx === 0 ? -10 : 15;

            const labelGroup = svg.append("g")
                .attr("transform", `translate(${x(pt.date) + xOffset}, ${y(pt.pm25_city) + yOffset})`);

            labelGroup.append("rect")
                .attr("x", -6)
                .attr("y", -14)
                .attr("width", 132)
                .attr("height", 24)
                .attr("rx", 4)
                .attr("fill", "#1e293b")
                .attr("opacity", 0.9);

            labelGroup.append("text")
                .attr("x", 4)
                .attr("y", 2)
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "#ffffff")
                .text(`${formatShort(pt.date)}: ${pt.pm25_city.toFixed(1)} µg/m³`);
        });

        // Interactive Bisector Hover
        const bisectDate = d3.bisector(d => d.date).center;

        const focus = svg.append("g")
            .attr("class", "focus-marker")
            .style("display", "none");

        focus.append("line")
            .attr("class", "hover-line")
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#64748b")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        focus.append("circle")
            .attr("r", 5)
            .attr("fill", "#dc2626")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);

        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mouseover", () => {
                focus.style("display", null);
                tooltip.style("opacity", 1);
            })
            .on("mouseout", () => {
                focus.style("display", "none");
                tooltip.style("opacity", 0);
            })
            .on("mousemove", (event) => {
                const x0 = x.invert(d3.pointer(event)[0]);
                const i = bisectDate(data, x0);
                const d = data[i];
                if (!d) return;

                focus.select("line").attr("x1", x(d.date)).attr("x2", x(d.date));
                focus.select("circle").attr("cx", x(d.date)).attr("cy", y(d.pm25_city));

                const statusColor = d.pm25_city > 75 ? "#ef4444" : (d.pm25_city > 15 ? "#f59e0b" : "#10b981");
                const statusText = d.pm25_city > 75 ? "Unhealthy (>75)" : (d.pm25_city > 15 ? "Moderate (16-75)" : "Good (≤15)");

                tooltip.html(`
                    <strong>${formatDisplay(d.date)}</strong><br>
                    PM2.5 City: <span style="color:#f87171;font-weight:bold;">${d.pm25_city.toFixed(1)} µg/m³</span><br>
                    Status: <span style="color:${statusColor};font-weight:bold;">${statusText}</span><br>
                    Temperature: <span class="sub-val">${d.temp_c.toFixed(1)}°C</span>
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 35) + "px");
            });
    }

    // ===================================================================
    // TASK 3: Cumulative Unhealthy Days Area Chart
    // ===================================================================
    function renderTask3(data, formatDisplay, formatShort) {
        const container = d3.select("#task3-chart");
        container.selectAll("*").remove();

        const margin = { top: 25, right: 40, bottom: 40, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 360 - margin.top - margin.bottom;

        // Compute running total of days > 75
        let cum = 0;
        const cumData = data.map(d => {
            if (d.pm25_city > 75) cum++;
            return {
                date: d.date,
                pm25_city: d.pm25_city,
                cumUnhealthy: cum
            };
        });

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain([new Date(2025, 0, 1), new Date(2025, 11, 31)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, 200])
            .range([height, 0]);

        // Gradient for filled area
        const defs = svg.append("defs");
        const gradient = defs.append("linearGradient")
            .attr("id", "cum-gradient")
            .attr("x1", "0%").attr("y1", "0%")
            .attr("x2", "0%").attr("y2", "100%");

        gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ea580c").attr("stop-opacity", 0.7);
        gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ffedd5").attr("stop-opacity", 0.1);

        // Grid lines
        svg.append("g")
            .attr("class", "grid-line")
            .call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        // Axes
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("Cumulative Days with PM2.5 > 75 µg/m³");

        // Filled Area
        const area = d3.area()
            .x(d => x(d.date))
            .y0(y(0))
            .y1(d => y(d.cumUnhealthy));

        svg.append("path")
            .datum(cumData)
            .attr("fill", "url(#cum-gradient)")
            .attr("d", area);

        // Area top line border
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.cumUnhealthy));

        svg.append("path")
            .datum(cumData)
            .attr("fill", "none")
            .attr("stroke", "#ea580c")
            .attr("stroke-width", 2.2)
            .attr("d", line);

        // Final endpoint badge (188)
        const lastPt = cumData[cumData.length - 1];
        svg.append("circle")
            .attr("cx", x(lastPt.date))
            .attr("cy", y(lastPt.cumUnhealthy))
            .attr("r", 5)
            .attr("fill", "#ea580c")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);

        svg.append("text")
            .attr("x", x(lastPt.date) - 15)
            .attr("y", y(lastPt.cumUnhealthy) - 12)
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "#c2410c")
            .attr("text-anchor", "end")
            .text(`Final Total: ${lastPt.cumUnhealthy} Days`);

        // Plateau Annotation (June-August)
        const plateauStart = new Date(2025, 4, 21);
        const plateauEnd = new Date(2025, 7, 31);
        svg.append("rect")
            .attr("x", x(plateauStart))
            .attr("y", y(105))
            .attr("width", x(plateauEnd) - x(plateauStart))
            .attr("height", 30)
            .attr("fill", "#f0fdf4")
            .attr("stroke", "#86efac")
            .attr("rx", 4);

        svg.append("text")
            .attr("x", (x(plateauStart) + x(plateauEnd)) / 2)
            .attr("y", y(105) + 19)
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", "#15803d")
            .attr("text-anchor", "middle")
            .text("Summer Monsoon Plateau (0 Unhealthy Days Added)");

        // Bisector interaction
        const bisectDate = d3.bisector(d => d.date).center;
        const focus = svg.append("g").style("display", "none");
        focus.append("circle").attr("r", 4.5).attr("fill", "#c2410c").attr("stroke", "#ffffff").attr("stroke-width", 1.5);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltip.style("opacity", 1); })
            .on("mouseout", () => { focus.style("display", "none"); tooltip.style("opacity", 0); })
            .on("mousemove", (event) => {
                const x0 = x.invert(d3.pointer(event)[0]);
                const i = bisectDate(cumData, x0);
                const d = cumData[i];
                if (!d) return;

                focus.attr("transform", `translate(${x(d.date)}, ${y(d.cumUnhealthy)})`);

                tooltip.html(`
                    <strong>${formatDisplay(d.date)}</strong><br>
                    Running Unhealthy Days: <span style="color:#ea580c;font-weight:bold;">${d.cumUnhealthy} / 188</span><br>
                    PM2.5 on this date: <span class="sub-val">${d.pm25_city.toFixed(1)} µg/m³</span><br>
                    Annual Progress: <span class="sub-val">${((d.cumUnhealthy / 188) * 100).toFixed(1)}% of total</span>
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 30) + "px");
            });
    }

    // ===================================================================
    // TASK 4: City vs Suburb Multi-Line Chart
    // ===================================================================
    function renderTask4(data, formatDisplay, formatShort) {
        const container = d3.select("#task4-chart");
        container.selectAll("*").remove();

        const margin = { top: 35, right: 40, bottom: 40, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain([new Date(2025, 0, 1), new Date(2025, 11, 31)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, 350])
            .nice()
            .range([height, 0]);

        svg.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

        svg.append("g").attr("class", "axis").call(d3.axisLeft(y));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("PM2.5 Concentration (µg/m³)");

        // City Line
        const cityLine = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.pm25_city));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#dc2626")
            .attr("stroke-width", 1.8)
            .attr("d", cityLine);

        // Suburb Line
        const suburbLine = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.pm25_suburb));

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#0284c7")
            .attr("stroke-width", 1.8)
            .attr("d", suburbLine);

        // Max difference callout (Feb 24, diff = 80.5)
        const feb24 = data.find(d => d.dateStr === "2025-02-24");
        if (feb24) {
            svg.append("line")
                .attr("x1", x(feb24.date)).attr("x2", x(feb24.date))
                .attr("y1", y(feb24.pm25_city)).attr("y2", y(feb24.pm25_suburb))
                .attr("stroke", "#8b5cf6")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "2,2");

            svg.append("circle").attr("cx", x(feb24.date)).attr("cy", y(feb24.pm25_city)).attr("r", 4.5).attr("fill", "#dc2626");
            svg.append("circle").attr("cx", x(feb24.date)).attr("cy", y(feb24.pm25_suburb)).attr("r", 4.5).attr("fill", "#0284c7");

            svg.append("text")
                .attr("x", x(feb24.date) + 8)
                .attr("y", (y(feb24.pm25_city) + y(feb24.pm25_suburb)) / 2)
                .attr("font-size", "11px")
                .attr("font-weight", "bold")
                .attr("fill", "#6b21a8")
                .text("Max Gap: Feb 24 (Δ = 80.5 µg/m³)");
        }

        // Legend at top
        const legend = svg.append("g").attr("transform", `translate(${width - 240}, -20)`);
        
        legend.append("line").attr("x1", 0).attr("x2", 22).attr("y1", 0).attr("y2", 0).attr("stroke", "#dc2626").attr("stroke-width", 2.5);
        legend.append("text").attr("x", 28).attr("y", 4).attr("font-size", "12px").attr("font-weight", "600").attr("fill", "#1e293b").text("City Centre (Mean: 86.4)");

        legend.append("line").attr("x1", 140).attr("x2", 162).attr("y1", 0).attr("y2", 0).attr("stroke", "#0284c7").attr("stroke-width", 2.5);
        legend.append("text").attr("x", 168).attr("y", 4).attr("font-size", "12px").attr("font-weight", "600").attr("fill", "#1e293b").text("Suburb (Mean: 69.2)");

        // Tooltip
        const bisectDate = d3.bisector(d => d.date).center;
        const focus = svg.append("g").style("display", "none");
        focus.append("line").attr("class", "hover-line").attr("y1", 0).attr("y2", height).attr("stroke", "#64748b").attr("stroke-width", 1).attr("stroke-dasharray", "3,3");
        focus.append("circle").attr("class", "dot-city").attr("r", 4.5).attr("fill", "#dc2626").attr("stroke", "#fff").attr("stroke-width", 1.5);
        focus.append("circle").attr("class", "dot-suburb").attr("r", 4.5).attr("fill", "#0284c7").attr("stroke", "#fff").attr("stroke-width", 1.5);

        svg.append("rect")
            .attr("width", width).attr("height", height)
            .attr("fill", "none").attr("pointer-events", "all")
            .on("mouseover", () => { focus.style("display", null); tooltip.style("opacity", 1); })
            .on("mouseout", () => { focus.style("display", "none"); tooltip.style("opacity", 0); })
            .on("mousemove", (event) => {
                const x0 = x.invert(d3.pointer(event)[0]);
                const i = bisectDate(data, x0);
                const d = data[i];
                if (!d) return;

                focus.select("line").attr("x1", x(d.date)).attr("x2", x(d.date));
                focus.select(".dot-city").attr("cx", x(d.date)).attr("cy", y(d.pm25_city));
                focus.select(".dot-suburb").attr("cx", x(d.date)).attr("cy", y(d.pm25_suburb));

                const diff = (d.pm25_city - d.pm25_suburb).toFixed(1);

                tooltip.html(`
                    <strong>${formatDisplay(d.date)}</strong><br>
                    <span style="color:#ef4444;">City Centre:</span> <strong>${d.pm25_city.toFixed(1)} µg/m³</strong><br>
                    <span style="color:#38bdf8;">Suburb:</span> <strong>${d.pm25_suburb.toFixed(1)} µg/m³</strong><br>
                    Difference: <span class="sub-val">${diff > 0 ? '+' + diff : diff} µg/m³ (City higher)</span>
                `)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 35) + "px");
            });
    }

    // ===================================================================
    // TASK 5: Monthly Pollution Levels (Stacked Bar Chart)
    // ===================================================================
    function renderTask5(data, monthNames, monthShortNames) {
        const container = d3.select("#task5-chart");
        container.selectAll("*").remove();

        const margin = { top: 35, right: 30, bottom: 45, left: 50 };
        const width = 1000 - margin.left - margin.right;
        const height = 380 - margin.top - margin.bottom;

        // Group data by month and count levels
        const monthlyLevels = [];
        for (let m = 0; m < 12; m++) {
            const mData = data.filter(d => d.date.getMonth() === m);
            let low = 0, mod = 0, high = 0, severe = 0;
            mData.forEach(d => {
                const val = d.pm25_city;
                if (val <= 35) low++;
                else if (val <= 75) mod++;
                else if (val <= 150) high++;
                else severe++;
            });
            monthlyLevels.push({
                monthIndex: m,
                monthName: monthNames[m],
                monthShort: monthShortNames[m],
                totalDays: mData.length,
                Low: low,
                Moderate: mod,
                High: high,
                Severe: severe
            });
        }

        const stackKeys = ["Low", "Moderate", "High", "Severe"];
        const stackColors = {
            "Low": "#10b981",       // emerald green
            "Moderate": "#f59e0b",  // amber
            "High": "#f97316",      // orange
            "Severe": "#b91c1c"     // deep red
        };

        const stack = d3.stack().keys(stackKeys);
        const stackedSeries = stack(monthlyLevels);

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(monthShortNames)
            .range([0, width])
            .padding(0.28);

        const y = d3.scaleLinear()
            .domain([0, 32])
            .nice()
            .range([height, 0]);

        svg.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(8));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("Number of Days in Month");

        // Render stacked bars
        svg.selectAll("g.layer")
            .data(stackedSeries)
            .join("g")
            .attr("class", "layer")
            .attr("fill", d => stackColors[d.key])
            .selectAll("rect")
            .data(d => d.map(item => ({ ...item, key: d.key })))
            .join("rect")
            .attr("x", d => x(d.data.monthShort))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .attr("rx", 1.5)
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1);
                const count = d[1] - d[0];
                const pct = ((count / d.data.totalDays) * 100).toFixed(1);
                tooltip.html(`
                    <strong>${d.data.monthName} 2025</strong><br>
                    Tier: <span style="color:${stackColors[d.key]};font-weight:bold;">${d.key}</span><br>
                    Days in Tier: <strong>${count} days</strong> (${pct}%)<br>
                    Total Days Recorded: <span class="sub-val">${d.data.totalDays} days</span>
                `);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Total count labels on top of bars
        svg.selectAll(".bar-total-label")
            .data(monthlyLevels)
            .join("text")
            .attr("class", "bar-total-label")
            .attr("x", d => x(d.monthShort) + x.bandwidth() / 2)
            .attr("y", d => y(d.totalDays) - 6)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", d => d.totalDays < 30 ? "#b91c1c" : "#475569")
            .text(d => `${d.totalDays}d`);

        // Legend
        const legend = svg.append("g").attr("transform", `translate(${width - 480}, -24)`);
        stackKeys.forEach((key, idx) => {
            const g = legend.append("g").attr("transform", `translate(${idx * 120}, 0)`);
            g.append("rect").attr("width", 14).attr("height", 14).attr("rx", 3).attr("fill", stackColors[key]);
            g.append("text").attr("x", 20).attr("y", 11).attr("font-size", "12px").attr("fill", "#1e293b").text(key);
        });
    }

    // ===================================================================
    // TASK 6: Day-of-Week × Month Heatmap
    // ===================================================================
    function renderTask6(data, monthShortNames, weekdayNames) {
        const container = d3.select("#task6-chart");
        container.selectAll("*").remove();

        const margin = { top: 30, right: 60, bottom: 40, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Compute average city PM2.5 for each Month x Weekday
        // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
        const weekdayMapping = [6, 0, 1, 2, 3, 4, 5]; // maps getDay() to Monday=0 ... Sunday=6

        const gridSums = Array.from({ length: 12 }, () => Array.from({ length: 7 }, () => ({ sum: 0, count: 0 })));
        data.forEach(d => {
            const m = d.date.getMonth();
            const w = weekdayMapping[d.date.getDay()];
            gridSums[m][w].sum += d.pm25_city;
            gridSums[m][w].count += 1;
        });

        const matrix = [];
        let minVal = 999, maxVal = -999;
        for (let m = 0; m < 12; m++) {
            for (let w = 0; w < 7; w++) {
                const cell = gridSums[m][w];
                const avg = cell.count > 0 ? cell.sum / cell.count : 0;
                if (avg < minVal) minVal = avg;
                if (avg > maxVal) maxVal = avg;
                matrix.push({
                    month: m,
                    weekday: w,
                    monthName: monthShortNames[m],
                    weekdayName: weekdayNames[w],
                    avg: avg,
                    count: cell.count
                });
            }
        }

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(weekdayNames).range([0, width]).padding(0.06);
        const y = d3.scaleBand().domain(monthShortNames).range([0, height]).padding(0.06);

        // Color scale: custom 4-stop vibrant heatmap (clean cream -> gold -> orange -> deep crimson)
        const colorScale = d3.scaleSequential()
            .domain([20, 180])
            .interpolator(d3.interpolateYlOrRd);

        // Axes
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0, -6)`)
            .call(d3.axisTop(x).tickSize(0))
            .select(".domain").remove();

        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).tickSize(0))
            .select(".domain").remove();

        // Render cells
        svg.selectAll("rect.cell")
            .data(matrix)
            .join("rect")
            .attr("class", "cell")
            .attr("x", d => x(d.weekdayName))
            .attr("y", d => y(d.monthName))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("rx", 4)
            .attr("fill", d => colorScale(d.avg))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1);
                tooltip.html(`
                    <strong>${d.monthName} — ${d.weekdayName}</strong><br>
                    Mean PM2.5: <span style="color:#f87171;font-weight:bold;">${d.avg.toFixed(1)} µg/m³</span><br>
                    Samples Count: <span class="sub-val">${d.count} days</span>
                `);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 30) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));

        // Cell numeric labels
        svg.selectAll("text.cell-label")
            .data(matrix)
            .join("text")
            .attr("class", "cell-label")
            .attr("x", d => x(d.weekdayName) + x.bandwidth() / 2)
            .attr("y", d => y(d.monthName) + y.bandwidth() / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", d => d.avg > 115 ? "#ffffff" : "#1e293b")
            .attr("pointer-events", "none")
            .text(d => Math.round(d.avg));

        // Heatmap color bar legend
        const legendW = 180, legendH = 10;
        const legendG = svg.append("g").attr("transform", `translate(${width - legendW}, ${height + 15})`);

        const defs = svg.append("defs");
        const legendGrad = defs.append("linearGradient").attr("id", "heatmap-legend-grad");
        legendGrad.append("stop").attr("offset", "0%").attr("stop-color", colorScale(20));
        legendGrad.append("stop").attr("offset", "50%").attr("stop-color", colorScale(100));
        legendGrad.append("stop").attr("offset", "100%").attr("stop-color", colorScale(180));

        legendG.append("rect")
            .attr("width", legendW)
            .attr("height", legendH)
            .attr("rx", 3)
            .attr("fill", "url(#heatmap-legend-grad)");

        legendG.append("text").attr("x", 0).attr("y", legendH + 12).attr("font-size", "10px").attr("fill", "#64748b").text("20 µg/m³ (Low)");
        legendG.append("text").attr("x", legendW).attr("y", legendH + 12).attr("text-anchor", "end").attr("font-size", "10px").attr("fill", "#64748b").text("180+ µg/m³ (Severe)");
    }

    // ===================================================================
    // TASK 7: Monthly Spread Band Chart (Min, Max, Mean)
    // ===================================================================
    function renderTask7(data, monthShortNames) {
        const container = d3.select("#task7-chart");
        container.selectAll("*").remove();

        const margin = { top: 30, right: 40, bottom: 40, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 380 - margin.top - margin.bottom;

        // Group by month
        const monthlyStats = [];
        for (let m = 0; m < 12; m++) {
            const mData = data.filter(d => d.date.getMonth() === m);
            const vals = mData.map(d => d.pm25_city);
            const min = d3.min(vals);
            const max = d3.max(vals);
            const mean = d3.mean(vals);
            monthlyStats.push({
                monthIndex: m,
                monthShort: monthShortNames[m],
                min,
                max,
                mean,
                spread: max - min
            });
        }

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scalePoint()
            .domain(monthShortNames)
            .range([0, width])
            .padding(0.4);

        const y = d3.scaleLinear()
            .domain([0, 350])
            .nice()
            .range([height, 0]);

        svg.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g").attr("class", "axis").call(d3.axisLeft(y));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("PM2.5 (µg/m³)");

        // Shaded Band between Min and Max
        const bandArea = d3.area()
            .x(d => x(d.monthShort))
            .y0(d => y(d.min))
            .y1(d => y(d.max))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(monthlyStats)
            .attr("fill", "#cbd5e1")
            .attr("fill-opacity", 0.45)
            .attr("d", bandArea);

        // Mean line
        const meanLine = d3.line()
            .x(d => x(d.monthShort))
            .y(d => y(d.mean))
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(monthlyStats)
            .attr("fill", "none")
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 2.6)
            .attr("d", meanLine);

        // Points for Min, Max, and Mean
        monthlyStats.forEach(d => {
            // Min node
            svg.append("circle").attr("cx", x(d.monthShort)).attr("cy", y(d.min)).attr("r", 3.5).attr("fill", "#0284c7");
            // Max node
            svg.append("circle").attr("cx", x(d.monthShort)).attr("cy", y(d.max)).attr("r", 3.5).attr("fill", "#dc2626");
            // Mean node
            svg.append("circle").attr("cx", x(d.monthShort)).attr("cy", y(d.mean)).attr("r", 5).attr("fill", "#0f172a").attr("stroke", "#fff").attr("stroke-width", 1.5);
        });

        // Callout on November (Widest Spread: 239.1)
        const nov = monthlyStats.find(d => d.monthShort === "Nov");
        if (nov) {
            svg.append("line")
                .attr("x1", x(nov.monthShort)).attr("x2", x(nov.monthShort) - 50)
                .attr("y1", y(nov.max)).attr("y2", y(nov.max) - 15)
                .attr("stroke", "#dc2626").attr("stroke-width", 1.2);

            const callout = svg.append("g").attr("transform", `translate(${x(nov.monthShort) - 170}, ${y(nov.max) - 34})`);
            callout.append("rect").attr("width", 155).attr("height", 24).attr("rx", 4).attr("fill", "#fee2e2").attr("stroke", "#f87171");
            callout.append("text").attr("x", 8).attr("y", 16).attr("font-size", "11px").attr("font-weight", "bold").attr("fill", "#b91c1c").text("Nov Spread: 239.1 µg/m³");
        }

        // Tooltip
        svg.selectAll("circle.hit-target")
            .data(monthlyStats)
            .join("circle")
            .attr("class", "hit-target")
            .attr("cx", d => x(d.monthShort))
            .attr("cy", d => y(d.mean))
            .attr("r", 16)
            .attr("fill", "transparent")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1);
                tooltip.html(`
                    <strong>Month of ${d.monthShort}</strong><br>
                    Max (Worst Day): <span style="color:#ef4444;font-weight:bold;">${d.max.toFixed(1)} µg/m³</span><br>
                    Mean: <span style="color:#38bdf8;font-weight:bold;">${d.mean.toFixed(1)} µg/m³</span><br>
                    Min (Best Day): <span style="color:#10b981;font-weight:bold;">${d.min.toFixed(1)} µg/m³</span><br>
                    Monthly Spread: <span class="sub-val">${d.spread.toFixed(1)} µg/m³</span>
                `);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 15) + "px").style("top", (event.pageY - 35) + "px");
            })
            .on("mouseout", () => tooltip.style("opacity", 0));
    }

    // ===================================================================
    // TASK 8: 7-Day Moving Average & Broken Line at Missing Data
    // ===================================================================
    function renderTask8(data, formatDisplay, formatShort) {
        const container = d3.select("#task8-chart");
        container.selectAll("*").remove();

        const margin = { top: 30, right: 40, bottom: 40, left: 60 };
        const width = 1000 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        // Identify sensor offline gap: March 12 to March 20
        // Data before gap: Jan 1 to Mar 11 (index 0 to 69)
        // Data after gap: Mar 21 to Dec 31 (index 70 to end)
        const seg1 = [];
        const seg2 = [];
        data.forEach(d => {
            if (d.date <= new Date(2025, 2, 11)) {
                seg1.push(d);
            } else if (d.date >= new Date(2025, 2, 21)) {
                seg2.push(d);
            }
        });

        // Compute 7-day moving average for each segment independently (NO averaging across gap!)
        function computeMA(segment) {
            return segment.map((d, i) => {
                const windowStart = Math.max(0, i - 6);
                const windowSlice = segment.slice(windowStart, i + 1);
                const ma = d3.mean(windowSlice, pt => pt.pm25_city);
                return {
                    ...d,
                    ma: ma
                };
            });
        }

        const seg1WithMA = computeMA(seg1);
        const seg2WithMA = computeMA(seg2);

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("width", "100%")
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3.scaleTime()
            .domain([new Date(2025, 0, 1), new Date(2025, 11, 31)])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, 350])
            .nice()
            .range([height, 0]);

        svg.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));

        svg.append("g").attr("class", "axis").call(d3.axisLeft(y));

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -height / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("PM2.5 Concentration (µg/m³)");

        // 1. Shaded Gap: March 11.5 to March 20.5 (9 missing days)
        const gapStart = new Date(2025, 2, 11, 12);
        const gapEnd = new Date(2025, 2, 20, 12);

        svg.append("rect")
            .attr("x", x(gapStart))
            .attr("y", 0)
            .attr("width", x(gapEnd) - x(gapStart))
            .attr("height", height)
            .attr("fill", "#fee2e2")
            .attr("opacity", 0.6)
            .attr("stroke", "#f87171")
            .attr("stroke-dasharray", "3,3");

        // Gap Label & Note
        const gapMid = new Date(2025, 2, 16);
        svg.append("text")
            .attr("x", x(gapMid))
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "11px")
            .attr("font-weight", "bold")
            .attr("fill", "#b91c1c")
            .text("No data: sensor offline");

        svg.append("text")
            .attr("x", x(gapMid))
            .attr("y", 58)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .attr("fill", "#7f1d1d")
            .text("(9 days missing: Mar 12–20)");

        // 2. Daily values as thin, faint line
        const dailyLine = d3.line().x(d => x(d.date)).y(d => y(d.pm25_city));

        svg.append("path")
            .datum(seg1WithMA)
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 1)
            .attr("opacity", 0.45)
            .attr("d", dailyLine);

        svg.append("path")
            .datum(seg2WithMA)
            .attr("fill", "none")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 1)
            .attr("opacity", 0.45)
            .attr("d", dailyLine);

        // 3. 7-Day Moving Average as thick, dark line (broken at gap!)
        const maLine = d3.line().x(d => x(d.date)).y(d => y(d.ma));

        svg.append("path")
            .datum(seg1WithMA)
            .attr("fill", "none")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 2.8)
            .attr("d", maLine);

        svg.append("path")
            .datum(seg2WithMA)
            .attr("fill", "none")
            .attr("stroke", "#0f172a")
            .attr("stroke-width", 2.8)
            .attr("d", maLine);

        // Legend
        const legend = svg.append("g").attr("transform", `translate(${width - 440}, -15)`);
        
        legend.append("line").attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0).attr("stroke", "#94a3b8").attr("stroke-width", 1.5).attr("opacity", 0.6);
        legend.append("text").attr("x", 26).attr("y", 4).attr("font-size", "11.5px").attr("fill", "#64748b").text("Daily Value (Raw Noise)");

        legend.append("line").attr("x1", 175).attr("x2", 195).attr("y1", 0).attr("y2", 0).attr("stroke", "#0f172a").attr("stroke-width", 2.8);
        legend.append("text").attr("x", 202).attr("y", 4).attr("font-size", "11.5px").attr("font-weight", "600").attr("fill", "#0f172a").text("7-Day Moving Average");
    }

    // ===================================================================
    // TASK 9: Focus + Context (Brush & Zoom)
    // ===================================================================
    function renderTask9(data, formatDisplay, formatShort) {
        const container = d3.select("#task9-chart");
        container.selectAll("*").remove();

        const svgWidth = 1000;
        const marginFocus = { top: 25, right: 30, bottom: 130, left: 60 };
        const marginContext = { top: 380, right: 30, bottom: 30, left: 60 };

        const width = svgWidth - marginFocus.left - marginFocus.right;
        const heightFocus = 330;
        const heightContext = 70;
        const totalHeight = marginContext.top + heightContext + marginContext.bottom;

        const svg = container.append("svg")
            .attr("viewBox", `0 0 ${svgWidth} ${totalHeight}`)
            .attr("width", "100%")
            .attr("height", totalHeight);

        // Clip Path to prevent line drawing outside chart boundaries when zoomed
        svg.append("defs").append("clipPath")
            .attr("id", "focus-clip")
            .append("rect")
            .attr("width", width)
            .attr("height", heightFocus);

        // Scales
        const xFocus = d3.scaleTime()
            .domain([new Date(2025, 0, 1), new Date(2025, 11, 31)])
            .range([0, width]);

        const yFocus = d3.scaleLinear()
            .domain([0, 350])
            .nice()
            .range([heightFocus, 0]);

        const xContext = d3.scaleTime()
            .domain(xFocus.domain())
            .range([0, width]);

        const yContext = d3.scaleLinear()
            .domain(yFocus.domain())
            .range([heightContext, 0]);

        // Focus Group
        const focusG = svg.append("g")
            .attr("class", "focus")
            .attr("transform", `translate(${marginFocus.left},${marginFocus.top})`);

        // Context Group
        const contextG = svg.append("g")
            .attr("class", "context")
            .attr("transform", `translate(${marginContext.left},${marginContext.top})`);

        // Grid lines for Focus
        const gridG = focusG.append("g")
            .attr("class", "grid-line")
            .call(d3.axisLeft(yFocus).tickSize(-width).tickFormat(""));

        // Focus Axes
        const xAxisFocus = d3.axisBottom(xFocus).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
        const yAxisFocus = d3.axisLeft(yFocus);

        const xAxisFocusG = focusG.append("g")
            .attr("class", "axis x-axis-focus")
            .attr("transform", `translate(0,${heightFocus})`)
            .call(xAxisFocus);

        focusG.append("g")
            .attr("class", "axis y-axis-focus")
            .call(yAxisFocus);

        focusG.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -heightFocus / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "#475569")
            .text("PM2.5 (µg/m³)");

        // WHO Guideline Reference lines in Focus
        focusG.append("line")
            .attr("class", "ref-line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", yFocus(15)).attr("y2", yFocus(15))
            .attr("stroke", "#16a34a").attr("stroke-dasharray", "3,3").attr("stroke-width", 1.2);

        focusG.append("line")
            .attr("class", "ref-line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", yFocus(75)).attr("y2", yFocus(75))
            .attr("stroke", "#ea580c").attr("stroke-dasharray", "3,3").attr("stroke-width", 1.2);

        // Focus Line Paths inside clip path
        const lineFocus = d3.line()
            .x(d => xFocus(d.date))
            .y(d => yFocus(d.pm25_city));

        const focusLineG = focusG.append("g")
            .attr("clip-path", "url(#focus-clip)");

        const pathFocus = focusLineG.append("path")
            .datum(data)
            .attr("class", "focus-path")
            .attr("fill", "none")
            .attr("stroke", "#dc2626")
            .attr("stroke-width", 1.8)
            .attr("d", lineFocus);

        // Context Chart
        const lineContext = d3.line()
            .x(d => xContext(d.date))
            .y(d => yContext(d.pm25_city));

        const areaContext = d3.area()
            .x(d => xContext(d.date))
            .y0(heightContext)
            .y1(d => yContext(d.pm25_city));

        contextG.append("path")
            .datum(data)
            .attr("fill", "#fed7aa")
            .attr("opacity", 0.5)
            .attr("d", areaContext);

        contextG.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#ea580c")
            .attr("stroke-width", 1.2)
            .attr("d", lineContext);

        const xAxisContext = d3.axisBottom(xContext).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
        contextG.append("g")
            .attr("class", "axis x-axis-context")
            .attr("transform", `translate(0,${heightContext})`)
            .call(xAxisContext);

        contextG.append("text")
            .attr("x", 0)
            .attr("y", -8)
            .attr("font-size", "11px")
            .attr("font-weight", "600")
            .attr("fill", "#64748b")
            .text("Full Year Overview (Drag handle to brush & zoom)");

        // Brush Behavior
        const brush = d3.brushX()
            .extent([[0, 0], [width, heightContext]])
            .on("brush end", brushed);

        const brushG = contextG.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed(event) {
            const selection = event.selection;
            if (selection) {
                const newDomain = selection.map(xContext.invert, xContext);
                xFocus.domain(newDomain);
            } else {
                xFocus.domain(xContext.domain());
            }

            pathFocus.attr("d", lineFocus);
            xAxisFocusG.call(xAxisFocus.scale(xFocus));
        }

        // Reset Button
        const resetBtn = document.getElementById("task9-reset-btn");
        if (resetBtn) {
            resetBtn.onclick = () => {
                brushG.call(brush.move, null);
            };
        }

        // Preset Range Buttons
        const presets = {
            "btn-full": null,
            "btn-smog": [new Date(2025, 10, 1), new Date(2025, 11, 31)],
            "btn-monsoon": [new Date(2025, 5, 1), new Date(2025, 7, 31)],
            "btn-widest": [new Date(2025, 10, 1), new Date(2025, 10, 30)],
            "btn-gap": [new Date(2025, 2, 1), new Date(2025, 2, 31)]
        };

        Object.keys(presets).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.onclick = () => {
                    const range = presets[btnId];
                    if (range) {
                        brushG.call(brush.move, [xContext(range[0]), xContext(range[1])]);
                    } else {
                        brushG.call(brush.move, null);
                    }
                };
            }
        });
    }

});

