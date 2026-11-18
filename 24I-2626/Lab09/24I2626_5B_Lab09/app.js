const tooltip = d3.select("#tooltip");

// --- Task 1: Treemap ---
d3.csv("dataset/university.csv", d3.autoType).then(data => {
    const width = 800, height = 400, legendHeight = 50;
    // Increased total SVG height to accommodate the legend
    const svg = d3.select("#task1").append("svg")
        .attr("width", width)
        .attr("height", height + legendHeight);
    
    // Group data: University -> Department -> Course
    const hierarchyData = d3.rollup(data, v => d3.sum(v, d => d.students), d => d.department, d => d.course);
    const root = d3.hierarchy([null, hierarchyData], ([, value]) => value.size && Array.from(value))
        .sum(([, value]) => value)
        .sort((a, b) => b.value - a.value);

    // Map layout strictly to the top 400px
    d3.treemap().size([width, height]).padding(2)(root);
    const color = d3.scaleOrdinal(d3.schemePastel1);

    const nodes = svg.selectAll("g.node").data(root.leaves()).join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.parent.data[0]))
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`Dept: ${d.parent.data[0]}<br>Course: ${d.data[0]}<br>Students: ${d.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    nodes.append("text")
        .attr("x", 4).attr("y", 14)
        .text(d => d.data[0])
        .attr("font-size", "10px").attr("fill", "#333");

    // Add the legend below the treemap
    const departments = Array.from(hierarchyData.keys());
    const legend = svg.append("g")
        .attr("transform", `translate(10, ${height + 15})`);
        
    const legendItems = legend.selectAll("g")
        .data(departments)
        .join("g")
        // Space the legend items out horizontally
        .attr("transform", (d, i) => `translate(${i * 180}, 0)`);
        
    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d));
        
    legendItems.append("text")
        .attr("x", 22)
        .attr("y", 12)
        .text(d => d)
        .attr("font-size", "12px")
        .attr("fill", "#333");
});

// --- Task 2: Dendrogram ---
d3.csv("dataset/university.csv", d3.autoType).then(data => {
    const width = 800, height = 400;
    const svg = d3.select("#task2").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(100, 20)");

    // Reshape data 
    const grouped = d3.group(data, d => d.department);
    const hierData = { name: "University", children: Array.from(grouped, ([key, values]) => ({
        name: key, children: values.map(v => ({ name: v.course, students: v.students }))
    }))};

    const root = d3.hierarchy(hierData);
    root.x0 = height / 2;
    root.y0 = 0;

    const cluster = d3.cluster().size([height - 40, width - 250]);
    
    // Depth color scale
    const colorScale = d => d.depth === 0 ? "#9c27b0" : d.depth === 1 ? "#ff9800" : "#4caf50";

    const gLink = svg.append("g").attr("class", "links");
    const gNode = svg.append("g").attr("class", "nodes");

    function update(source) {
        // Calculate the new tree layout
        const treeData = cluster(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        // --- NODES ---
        const node = gNode.selectAll("g.node")
            .data(nodes, d => d.data.name);

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on("click", (event, d) => {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            });

        nodeEnter.append("circle")
            .attr("r", 6)
            .style("fill", d => d._children ? colorScale(d) : "#fff")
            .style("stroke", d => colorScale(d))
            .style("stroke-width", "3px")
            .style("cursor", "pointer");

        // Add the primary text and a cloned white halo behind it
        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d.children || d._children ? -10 : 10)
            .style("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.name)
            .style("font-size", "12px")
            .style("fill", "#333")
            .clone(true).lower() // Clones the text and places it behind
            .style("stroke", "white")
            .style("stroke-width", "5px")
            .style("stroke-linejoin", "round")
            .style("fill", "none");

        const nodeUpdate = nodeEnter.merge(node);

        nodeUpdate.transition().duration(500)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        nodeUpdate.select("circle")
            .style("fill", d => d._children ? colorScale(d) : "#fff")
            .style("stroke", d => colorScale(d));

        // Update BOTH text and halo positions on expand/collapse
        nodeUpdate.selectAll("text")
            .attr("x", d => d.children || d._children ? -10 : 10)
            .style("text-anchor", d => d.children || d._children ? "end" : "start");

        const nodeExit = node.exit().transition().duration(500)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        // --- LINKS ---
        const link = gLink.selectAll("path.link")
            .data(links, d => d.target.data.name);

        const linkEnter = link.enter().append("path")
            .attr("class", "link")
            .style("fill", "none")
            .style("stroke", "#ccc")
            .style("stroke-width", "2px")
            .attr("d", d => {
                const o = {x: source.x0, y: source.y0};
                return d3.linkHorizontal().x(d => d.y).y(d => d.x)({source: o, target: o});
            });

        const linkUpdate = linkEnter.merge(link);

        linkUpdate.transition().duration(500)
            .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x));

        link.exit().transition().duration(500)
            .attr("d", d => {
                const o = {x: source.x, y: source.y};
                return d3.linkHorizontal().x(d => d.y).y(d => d.x)({source: o, target: o});
            })
            .remove();

        // Store old positions for transition animations
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    update(root);
});

// --- Task 3: Force-Directed Network ---
d3.csv("dataset/flights.csv", d3.autoType).then(data => {
    const width = 800, height = 500;
    const svg = d3.select("#task3").append("svg").attr("width", width).attr("height", height);

    const nodesMap = new Map();
    data.forEach(d => {
        if (!nodesMap.has(d.source)) nodesMap.set(d.source, { id: d.source, degree: 0 });
        if (!nodesMap.has(d.target)) nodesMap.set(d.target, { id: d.target, degree: 0 });
        nodesMap.get(d.source).degree += 1;
        nodesMap.get(d.target).degree += 1;
    });

    const nodes = Array.from(nodesMap.values());
    const links = data.map(d => ({ source: d.source, target: d.target, flights: d.flights }));

    const widthScale = d3.scaleLinear().domain(d3.extent(links, d => d.flights)).range([1, 8]);
    const radiusScale = d3.scaleSqrt().domain(d3.extent(nodes, d => d.degree)).range([5, 20]);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.selectAll("line").data(links).join("line")
        .attr("stroke", "#999").attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => widthScale(d.flights));

    const node = svg.selectAll("g").data(nodes).join("g")
        .call(d3.drag()
            .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

    node.append("circle")
        .attr("r", d => radiusScale(d.degree))
        .attr("fill", "tomato")
        .on("mouseover", function(event, d) {
            link.style("stroke-opacity", l => (l.source === d || l.target === d) ? 1 : 0.1);
        })
        .on("mouseout", () => link.style("stroke-opacity", 0.6));

    node.append("text").attr("dx", 15).attr("dy", 4).text(d => d.id).attr("font-size", "12px");

    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    svg.append("text")
        .attr("x", 10)
        .attr("y", height - 10)
        .attr("font-size", "12px")
        .attr("fill", "#666")
        .text("Dot size = number of routes, line width = flights");
});

// --- Task 4 & 5 & 6 Data Loading ---
Promise.all([
    d3.json("dataset/custom.geo.json"),
    d3.csv("dataset/population.csv", d3.autoType),
    d3.csv("dataset/pakistan_cities.csv", d3.autoType),
    d3.csv("dataset/flights.csv", d3.autoType)
]).then(([geoData, popData, citiesData, flightsData]) => {
    
    // --- Task 4: Choropleth Map ---
    const w4 = 800, h4 = 400;
    const svg4 = d3.select("#task4").append("svg").attr("width", w4).attr("height", h4);
    const projection4 = d3.geoNaturalEarth1().fitSize([w4, h4], geoData);
    const path4 = d3.geoPath().projection(projection4);
    
    const popMap = new Map(popData.map(d => [d.id, d.population_millions]));
    const colorScale = d3.scaleSequentialSqrt(d3.interpolateBlues)
        .domain([0, d3.max(popData, d => d.population_millions)]);

    svg4.selectAll("path").data(geoData.features).join("path")
        .attr("d", path4)
        .attr("fill", d => {
            let val = popMap.get(d.properties.iso_a3);
            return val ? colorScale(val) : "#e0e0e0";
        })
        .attr("class", "map-path")
        .on("mouseover", (event, d) => {
            let val = popMap.get(d.properties.iso_a3) || "No data";
            tooltip.style("opacity", 1).html(`${d.properties.name}<br>Pop: ${val}M`)
                .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    // --- Task 5: Point Map (Pakistan) & Task 6: Combined Map ---
    const w5 = 800, h5 = 600;
    [d3.select("#task5"), d3.select("#task6")].forEach((container, i) => {
        const isCombined = (i === 1);
        const svg = container.append("svg").attr("width", w5).attr("height", h5);
        
        // Filter map to show mainly Pakistan and surroundings
        const projection = d3.geoMercator().center([69, 30]).scale(2000).translate([w5 / 2, h5 / 2]);
        const path = d3.geoPath().projection(projection);

        svg.selectAll("path").data(geoData.features).join("path")
            .attr("d", path).attr("fill", "#eef7f6").attr("stroke", "#ccc");

        const radScale = d3.scaleSqrt().domain([0, d3.max(citiesData, d => d.pop)]).range([2, 30]);
        
        // Node map for routes mapping
        const cityMap = new Map(citiesData.map(d => [d.name, { ...d, coords: projection([d.lon, d.lat]) }]));

        // Task 6: Add routes layer BEFORE cities
        if (isCombined) {
            // Count degrees to determine hubs
            const degreeMap = new Map();
            flightsData.forEach(d => {
                degreeMap.set(d.source, (degreeMap.get(d.source) || 0) + 1);
                degreeMap.set(d.target, (degreeMap.get(d.target) || 0) + 1);
            });

            const routeWidthScale = d3.scaleLinear().domain(d3.extent(flightsData, d => d.flights)).range([1, 6]);

            const routes = svg.selectAll(".route").data(flightsData).join("line")
                .attr("class", "route")
                .attr("x1", d => cityMap.get(d.source)?.coords[0])
                .attr("y1", d => cityMap.get(d.source)?.coords[1])
                .attr("x2", d => cityMap.get(d.target)?.coords[0])
                .attr("y2", d => cityMap.get(d.target)?.coords[1])
                .attr("stroke", "#888").attr("stroke-width", d => routeWidthScale(d.flights))
                .attr("stroke-opacity", 0.6);

            // Add Cities
            svg.selectAll("circle").data(citiesData).join("circle")
                .attr("cx", d => cityMap.get(d.name).coords[0])
                .attr("cy", d => cityMap.get(d.name).coords[1])
                .attr("r", d => radScale(d.pop))
                .attr("fill", d => (degreeMap.get(d.name) >= 4) ? "#d95f02" : "#7570b3")
                .attr("opacity", 0.8)
                .on("mouseover", (event, d) => {
                    routes.attr("stroke-opacity", l => (l.source === d.name || l.target === d.name) ? 1 : 0.05);
                    tooltip.style("opacity", 1).html(`${d.name}<br>Pop: ${(d.pop).toFixed(1)}M`)
                        .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", () => {
                    routes.attr("stroke-opacity", 0.6);
                    tooltip.style("opacity", 0);
                });

            // Add Legend for Task 6 Encodings
            svg.append("text")
                .attr("x", 10)
                .attr("y", h5 - 10)
                .attr("font-size", "12px")
                .attr("fill", "#333")
                .text("Encodings: Position = Location | Size = Population | Color = Hub (Orange ≥ 4 routes, Purple < 4) | Line Width = Flights/week");

        } else {
            // Task 5: Only Cities
            svg.selectAll("circle").data(citiesData).join("circle")
                .attr("cx", d => projection([d.lon, d.lat])[0])
                .attr("cy", d => projection([d.lon, d.lat])[1])
                .attr("r", d => radScale(d.pop))
                .attr("fill", "tomato").attr("opacity", 0.6)
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1).html(`${d.name}<br>Pop: ${(d.pop).toFixed(1)}M`)
                        .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", () => tooltip.style("opacity", 0));

            // Labels for > 1M pop (Fixed to > 1 since data is already in millions)
            svg.selectAll(".city-label").data(citiesData.filter(d => d.pop > 1)).join("text")
                .attr("x", d => projection([d.lon, d.lat])[0] + radScale(d.pop) + 2)
                .attr("y", d => projection([d.lon, d.lat])[1] + 4)
                .text(d => d.name).attr("font-size", "10px").attr("fill", "#000")
                // Add halo to labels so they stand out against map borders
                .clone(true).lower()
                .style("stroke", "white")
                .style("stroke-width", "3px")
                .style("stroke-linejoin", "round")
                .style("fill", "none");
        }
    });
});