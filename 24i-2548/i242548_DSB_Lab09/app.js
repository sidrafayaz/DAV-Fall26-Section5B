/**
 * FAST-NUCES Islamabad — Data Analysis and Visualization
 * Lab 09: Hierarchical, Network & Geospatial Visualizations with D3.js
 * Basic White UI Implementation (No Gradients, Flat Solid Colors, Clean Legends)
 */

// Global State
const AppState = {
  university: null,
  flights: null,
  cities: null,
  population: null,
  geoWorld: null,
  activeTask: 'task1'
};

// ==========================================================================
// Tooltip Helper (Basic White)
// ==========================================================================
const Tooltip = {
  el: null,
  init() {
    this.el = document.getElementById('d3-tooltip');
    if (!this.el) {
      this.el = document.createElement('div');
      this.el.id = 'd3-tooltip';
      document.body.appendChild(this.el);
    }
  },
  show(event, title, rows = []) {
    if (!this.el) this.init();
    let html = `<div class="tt-title">${title}</div>`;
    rows.forEach(r => {
      html += `<div class="tt-row"><span>${r.label}:</span><strong>${r.value}</strong></div>`;
    });
    this.el.innerHTML = html;
    this.el.style.opacity = '1';

    const padding = 12;
    let x = event.clientX + padding;
    let y = event.clientY + padding;

    const rect = this.el.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
      x = event.clientX - rect.width - padding;
    }
    if (y + rect.height > window.innerHeight) {
      y = event.clientY - rect.height - padding;
    }

    this.el.style.left = `${Math.max(8, x)}px`;
    this.el.style.top = `${Math.max(8, y)}px`;
  },
  hide() {
    if (this.el) {
      this.el.style.opacity = '0';
    }
  }
};

// ==========================================================================
// Department Flat Color Themes (Basic & Solid)
// ==========================================================================
const DeptThemes = {
  'Computer Science': {
    name: 'Computer Science',
    bg: '#EEF2FF',
    stroke: '#4338CA',
    headerBg: '#4338CA',
    text: '#1E1B4B'
  },
  'Engineering': {
    name: 'Engineering',
    bg: '#ECFDF5',
    stroke: '#0F766E',
    headerBg: '#0F766E',
    text: '#064E3B'
  },
  'Business': {
    name: 'Business',
    bg: '#FFF7ED',
    stroke: '#9A3412',
    headerBg: '#9A3412',
    text: '#7C2D12'
  },
  'Sciences': {
    name: 'Sciences',
    bg: '#FEF3C7',
    stroke: '#92400E',
    headerBg: '#92400E',
    text: '#78350F'
  }
};

// ==========================================================================
// TASK 1: Course Enrollment Treemap
// ==========================================================================
function initTreemap(data) {
  const container = document.getElementById('treemap-container');
  if (!container) return;
  container.innerHTML = '';

  const width = 1000;
  const height = 560;

  // 1. Reshape flat CSV data into parent-child hierarchy: University -> Department -> Course
  const nested = d3.group(data, d => d.department);
  const hierarchyData = {
    name: "University",
    children: Array.from(nested, ([dept, courses]) => ({
      name: dept,
      children: courses.map(c => ({
        name: c.course,
        students: +c.students,
        department: dept
      }))
    }))
  };

  const root = d3.hierarchy(hierarchyData)
    .sum(d => d.students)
    .sort((a, b) => b.value - a.value);

  const treemapLayout = d3.treemap()
    .size([width, height])
    .paddingTop(30)
    .paddingInner(4)
    .paddingOuter(4)
    .round(true);

  treemapLayout(root);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background', '#ffffff');

  const totalStudents = root.value;

  // Department Groups
  const deptGroups = svg.selectAll('.dept-group')
    .data(root.children)
    .join('g')
    .attr('class', 'dept-group')
    .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

  deptGroups.each(function(d) {
    const g = d3.select(this);
    const w = d.x1 - d.x0;
    const h = d.y1 - d.y0;
    const theme = DeptThemes[d.data.name];

    // Group border
    g.append('rect')
      .attr('width', w)
      .attr('height', h)
      .attr('fill', 'none')
      .attr('stroke', theme.stroke)
      .attr('stroke-width', 1.5);

    // Group header bar
    g.append('rect')
      .attr('width', w)
      .attr('height', 24)
      .attr('fill', theme.headerBg);

    // Header title
    g.append('text')
      .attr('x', 8)
      .attr('y', 16)
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text(`${d.data.name} (${d.value} students)`);
  });

  // Course Leaf Rectangles
  const leaves = svg.selectAll('.course-leaf')
    .data(root.leaves())
    .join('g')
    .attr('class', 'course-leaf')
    .attr('transform', d => `translate(${d.x0}, ${d.y0})`);

  leaves.each(function(d) {
    const g = d3.select(this);
    const w = Math.max(0, d.x1 - d.x0);
    const h = Math.max(0, d.y1 - d.y0);
    const theme = DeptThemes[d.data.department];

    g.append('rect')
      .attr('class', 'treemap-node')
      .attr('width', w)
      .attr('height', h)
      .attr('fill', theme.bg)
      .attr('stroke', theme.stroke)
      .attr('stroke-width', 1)
      .on('mouseenter', (event) => {
        const deptTotal = d.parent ? d.parent.value : d.value;
        Tooltip.show(event, d.data.name, [
          { label: 'Department', value: d.data.department },
          { label: 'Students', value: `${d.value}` },
          { label: 'Share of Dept', value: `${((d.value / deptTotal) * 100).toFixed(1)}%` },
          { label: 'Share of University', value: `${((d.value / totalStudents) * 100).toFixed(1)}%` }
        ]);
      })
      .on('mousemove', (event) => {
        Tooltip.show(event, d.data.name, [
          { label: 'Department', value: d.data.department },
          { label: 'Students', value: `${d.value}` },
          { label: 'Share of Dept', value: `${((d.value / d.parent.value) * 100).toFixed(1)}%` },
          { label: 'Share of University', value: `${((d.value / totalStudents) * 100).toFixed(1)}%` }
        ]);
      })
      .on('mouseleave', () => Tooltip.hide());

    // Clip path for text
    const clipId = `clip-${d.data.department.replace(/[^a-zA-Z]/g, '')}-${d.data.name.replace(/[^a-zA-Z]/g, '')}`;
    g.append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('width', Math.max(0, w - 6))
      .attr('height', Math.max(0, h - 6));

    if (w > 40 && h > 24) {
      const textGroup = g.append('g')
        .attr('clip-path', `url(#${clipId})`)
        .attr('transform', 'translate(8, 6)');

      textGroup.append('text')
        .attr('x', 0)
        .attr('y', 14)
        .attr('fill', theme.text)
        .attr('font-size', w < 75 ? '11px' : '13px')
        .attr('font-weight', 'bold')
        .text(d.data.name);

      if (h > 45) {
        textGroup.append('text')
          .attr('x', 0)
          .attr('y', 30)
          .attr('fill', theme.stroke)
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .text(`${d.value} students`);
      }
    }
  });

  // Flat Legend
  const legendContainer = document.getElementById('treemap-legend');
  if (legendContainer) {
    legendContainer.innerHTML = '';
    root.children.forEach(dept => {
      const theme = DeptThemes[dept.data.name];
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-swatch" style="background:${theme.headerBg}; border-color:${theme.stroke}"></span>
        <span><strong>${dept.data.name}</strong>: ${dept.value} students</span>
      `;
      legendContainer.appendChild(item);
    });
  }
}

// ==========================================================================
// TASK 2: University Structure Dendrogram
// ==========================================================================
let dendroRoot = null;
let dendroLayout = null;
let dendroSvg = null;
let dendroG = null;
const dendroWidth = 1000;
const dendroHeight = 580;

function initDendrogram(data) {
  const container = document.getElementById('dendrogram-container');
  if (!container) return;
  container.innerHTML = '';

  const margin = { top: 40, right: 180, bottom: 40, left: 110 };
  const innerWidth = dendroWidth - margin.left - margin.right;
  const innerHeight = dendroHeight - margin.top - margin.bottom;

  const nested = d3.group(data, d => d.department);
  const hierarchyData = {
    name: "University",
    children: Array.from(nested, ([dept, courses]) => ({
      name: dept,
      children: courses.map(c => ({
        name: c.course,
        students: +c.students,
        department: dept
      }))
    }))
  };

  dendroRoot = d3.hierarchy(hierarchyData);
  dendroRoot.x0 = innerHeight / 2;
  dendroRoot.y0 = 0;

  dendroLayout = d3.cluster().size([innerHeight, innerWidth]);

  dendroSvg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${dendroWidth} ${dendroHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background', '#ffffff');

  dendroG = dendroSvg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  updateDendrogram(dendroRoot);

  const btnExpand = document.getElementById('dendro-expand-all');
  const btnCollapse = document.getElementById('dendro-collapse-all');

  if (btnExpand) {
    btnExpand.onclick = () => {
      dendroRoot.descendants().forEach(d => {
        if (d._children) {
          d.children = d._children;
          d._children = null;
        }
      });
      updateDendrogram(dendroRoot);
    };
  }

  if (btnCollapse) {
    btnCollapse.onclick = () => {
      dendroRoot.children.forEach(d => {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        }
      });
      updateDendrogram(dendroRoot);
    };
  }
}

function updateDendrogram(source) {
  const duration = 400;
  dendroLayout(dendroRoot);

  const nodes = dendroRoot.descendants();
  const links = dendroRoot.links();

  const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

  // Links
  const linkSelection = dendroG.selectAll('path.dendro-link')
    .data(links, d => `${d.source.data.name}-${d.target.data.name}`);

  const linkEnter = linkSelection.enter()
    .append('path')
    .attr('class', 'dendro-link')
    .attr('d', () => {
      const o = { x: source.x0 || 0, y: source.y0 || 0 };
      return diagonal({ source: o, target: o });
    });

  linkSelection.merge(linkEnter)
    .transition().duration(duration)
    .attr('d', diagonal);

  linkSelection.exit()
    .transition().duration(duration)
    .attr('d', () => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    })
    .remove();

  // Nodes
  const nodeSelection = dendroG.selectAll('g.dendro-node')
    .data(nodes, d => `${d.depth}-${d.data.name}`);

  const nodeEnter = nodeSelection.enter()
    .append('g')
    .attr('class', 'dendro-node')
    .attr('transform', () => `translate(${source.y0 || 0}, ${source.x0 || 0})`)
    .on('click', (event, d) => {
      if (d.depth === 1) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        updateDendrogram(d);
      }
    })
    .on('mouseenter', (event, d) => {
      if (d.depth === 2) {
        Tooltip.show(event, d.data.name, [
          { label: 'Level', value: 'Course (Leaf Node)' },
          { label: 'Department', value: d.data.department },
          { label: 'Students', value: `${d.data.students}` }
        ]);
      } else if (d.depth === 1) {
        const studentSum = (d.children || d._children || []).reduce((acc, c) => acc + (c.data.students || 0), 0);
        Tooltip.show(event, d.data.name, [
          { label: 'Level', value: 'Department (Branch Node)' },
          { label: 'Courses', value: (d.children || d._children || []).length },
          { label: 'Total Enrollment', value: `${studentSum} students` },
          { label: 'Action', value: d.children ? 'Click to collapse' : 'Click to expand' }
        ]);
      } else {
        Tooltip.show(event, 'University', [
          { label: 'Level', value: 'Root Node (Depth 0)' }
        ]);
      }
    })
    .on('mouseleave', () => Tooltip.hide());

  // Circle marker
  nodeEnter.append('circle')
    .attr('r', d => d.depth === 0 ? 8 : (d.depth === 1 ? 7 : 5))
    .attr('fill', d => d.depth === 0 ? '#4b5563' : (d.depth === 1 ? '#2563eb' : '#10b981'))
    .attr('stroke', '#1f2937')
    .attr('stroke-width', 1.5);

  // Labels: leaf on right, parent on left
  nodeEnter.append('text')
    .attr('dy', '0.35em')
    .attr('x', d => (d.depth === 2 ? 12 : -12))
    .attr('text-anchor', d => (d.depth === 2 ? 'start' : 'end'))
    .text(d => d.data.name)
    .style('font-weight', d => (d.depth < 2 ? 'bold' : 'normal'))
    .style('font-size', d => (d.depth === 0 ? '13px' : (d.depth === 1 ? '12px' : '11.5px')))
    .style('fill', '#1f2937');

  const nodeUpdate = nodeSelection.merge(nodeEnter).transition().duration(duration)
    .attr('transform', d => `translate(${d.y}, ${d.x})`);

  nodeUpdate.select('circle')
    .attr('fill', d => {
      if (d._children) return '#f59e0b'; // Collapsed indicator
      return d.depth === 0 ? '#4b5563' : (d.depth === 1 ? '#2563eb' : '#10b981');
    });

  nodeSelection.exit().transition().duration(duration)
    .attr('transform', () => `translate(${source.y}, ${source.x})`)
    .remove();

  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// ==========================================================================
// TASK 3: Flight Route Network (Force-Directed Graph)
// ==========================================================================
let flightSimulation = null;

function initNetworkGraph(flightsData) {
  const container = document.getElementById('network-container');
  if (!container) return;
  container.innerHTML = '';

  const width = 1000;
  const height = 560;

  const nodeMap = new Map();
  flightsData.forEach(d => {
    if (!nodeMap.has(d.source)) nodeMap.set(d.source, { id: d.source, routes: 0, totalFlights: 0, destinations: [] });
    if (!nodeMap.has(d.target)) nodeMap.set(d.target, { id: d.target, routes: 0, totalFlights: 0, destinations: [] });

    const src = nodeMap.get(d.source);
    const tgt = nodeMap.get(d.target);

    src.routes += 1;
    src.totalFlights += +d.flights;
    src.destinations.push({ city: d.target, flights: +d.flights });

    tgt.routes += 1;
    tgt.totalFlights += +d.flights;
    tgt.destinations.push({ city: d.source, flights: +d.flights });
  });

  const nodes = Array.from(nodeMap.values());
  const links = flightsData.map(d => ({ source: d.source, target: d.target, flights: +d.flights }));

  const maxRoutes = d3.max(nodes, d => d.routes) || 7;
  const nodeRadiusScale = d3.scaleSqrt().domain([1, maxRoutes]).range([12, 26]);

  const flightExtent = d3.extent(links, d => d.flights) || [6, 70];
  const linkWidthScale = d3.scaleLinear().domain(flightExtent).range([1.5, 7.5]);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background', '#ffffff');

  const g = svg.append('g');

  if (flightSimulation) flightSimulation.stop();

  flightSimulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(135))
    .force('charge', d3.forceManyBody().strength(-360))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => nodeRadiusScale(d.routes) + 22));

  // Links
  const linkElements = g.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'net-link')
    .attr('stroke', '#9ca3af')
    .attr('stroke-width', d => linkWidthScale(d.flights))
    .on('mouseenter', (event, d) => {
      const srcName = typeof d.source === 'object' ? d.source.id : d.source;
      const tgtName = typeof d.target === 'object' ? d.target.id : d.target;
      Tooltip.show(event, `${srcName} ↔ ${tgtName}`, [
        { label: 'Weekly Flights', value: `${d.flights} flights/week` }
      ]);
    })
    .on('mouseleave', () => Tooltip.hide());

  // Nodes
  const nodeElements = g.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'net-node')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
    );

  // Flat circles: Hubs = solid orange (#ea580c), Non-hubs = solid light gray (#e5e7eb)
  nodeElements.append('circle')
    .attr('r', d => nodeRadiusScale(d.routes))
    .attr('fill', d => d.routes >= 4 ? '#ea580c' : '#e5e7eb')
    .attr('stroke', d => d.routes >= 4 ? '#9a3412' : '#6b7280')
    .attr('stroke-width', 2);

  // Labels
  nodeElements.append('text')
    .attr('dy', d => -nodeRadiusScale(d.routes) - 5)
    .attr('text-anchor', 'middle')
    .text(d => d.id)
    .style('font-weight', d => d.routes >= 4 ? 'bold' : 'normal')
    .style('font-size', d => d.routes >= 4 ? '13px' : '11.5px')
    .style('fill', '#111827');

  // Hover Highlighting
  nodeElements
    .on('mouseenter', (event, selectedNode) => {
      const connectedCitySet = new Set();
      connectedCitySet.add(selectedNode.id);

      linkElements.each(function(l) {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;

        if (srcId === selectedNode.id || tgtId === selectedNode.id) {
          connectedCitySet.add(srcId);
          connectedCitySet.add(tgtId);
          d3.select(this)
            .attr('stroke', '#2563eb')
            .attr('stroke-opacity', 1);
        } else {
          d3.select(this)
            .attr('stroke', '#9ca3af')
            .attr('stroke-opacity', 0.1);
        }
      });

      nodeElements.each(function(n) {
        if (connectedCitySet.has(n.id)) {
          d3.select(this).style('opacity', 1);
        } else {
          d3.select(this).style('opacity', 0.15);
        }
      });

      const destList = selectedNode.destinations.map(d => `${d.city} (${d.flights}/wk)`).join(', ');
      Tooltip.show(event, selectedNode.id, [
        { label: 'Role', value: selectedNode.routes >= 4 ? 'Primary Hub (≥ 4 routes)' : 'Standard City' },
        { label: 'Routes (Degree)', value: `${selectedNode.routes}` },
        { label: 'Total Flights', value: `${selectedNode.totalFlights}/week` },
        { label: 'Connected', value: destList }
      ]);
    })
    .on('mouseleave', () => {
      linkElements.attr('stroke', '#9ca3af').attr('stroke-opacity', 0.6);
      nodeElements.style('opacity', 1);
      Tooltip.hide();
    });

  flightSimulation.on('tick', () => {
    nodes.forEach(d => {
      d.x = Math.max(45, Math.min(width - 45, d.x));
      d.y = Math.max(45, Math.min(height - 45, d.y));
    });

    linkElements
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeElements
      .attr('transform', d => `translate(${d.x}, ${d.y})`);
  });

  function dragstarted(event, d) {
    if (!event.active) flightSimulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = Math.max(45, Math.min(width - 45, event.x));
    d.fy = Math.max(45, Math.min(height - 45, event.y));
  }

  function dragended(event, d) {
    if (!event.active) flightSimulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  const btnRestart = document.getElementById('net-restart-btn');
  if (btnRestart) {
    btnRestart.onclick = () => flightSimulation.alpha(1).restart();
  }
}

// ==========================================================================
// TASK 4: World Population Choropleth Map (Flat Solid Colors, No Gradient)
// ==========================================================================
// Discrete flat color tiers (square-root interval distribution)
const ChoroBins = [
  { max: 40, color: '#c6dbef', label: '≤ 40M' },
  { max: 100, color: '#9ecae1', label: '40M – 100M' },
  { max: 250, color: '#6baed6', label: '100M – 250M' },
  { max: 500, color: '#3182bd', label: '250M – 500M' },
  { max: Infinity, color: '#08519c', label: '≥ 1.0B' }
];

function getChoroColor(pop) {
  if (pop === undefined || pop === null || isNaN(pop)) return '#e5e7eb'; // Flat light gray for missing
  for (const b of ChoroBins) {
    if (pop <= b.max) return b.color;
  }
  return '#08519c';
}

function initChoroplethMap(popData, geoData) {
  const container = document.getElementById('choropleth-container');
  if (!container) return;
  container.innerHTML = '';

  const width = 1000;
  const height = 540;

  const popMap = new Map();
  popData.forEach(d => {
    popMap.set(d.id.trim().toUpperCase(), {
      id: d.id.trim(),
      country: d.country.trim(),
      population: +d.population_millions
    });
  });

  const projection = d3.geoNaturalEarth1()
    .scale(175)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background', '#ffffff');

  // Flat white ocean
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#ffffff');

  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => g.attr('transform', event.transform));

  svg.call(zoom);

  const btnZoomIn = document.getElementById('choro-zoom-in');
  const btnZoomOut = document.getElementById('choro-zoom-out');
  const btnReset = document.getElementById('choro-reset-zoom');

  if (btnZoomIn) btnZoomIn.onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 1.4);
  if (btnZoomOut) btnZoomOut.onclick = () => svg.transition().duration(300).call(zoom.scaleBy, 0.7);
  if (btnReset) btnReset.onclick = () => svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity);

  // Draw countries with solid flat colors
  g.selectAll('path.map-country')
    .data(geoData.features)
    .join('path')
    .attr('class', 'map-country')
    .attr('d', path)
    .attr('fill', d => {
      const code = (d.properties.adm0_a3 || d.properties.iso_a3 || d.id || '').toUpperCase();
      const rec = popMap.get(code);
      return rec ? getChoroColor(rec.population) : '#e5e7eb';
    })
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 0.5)
    .on('mouseenter', function(event, d) {
      const code = (d.properties.adm0_a3 || d.properties.iso_a3 || d.id || '').toUpperCase();
      const rec = popMap.get(code);
      const countryName = rec ? rec.country : (d.properties.name || 'Unknown Country');

      d3.select(this).raise().attr('stroke', '#000000').attr('stroke-width', 1.5);

      if (rec) {
        Tooltip.show(event, countryName, [
          { label: 'Code', value: rec.id },
          { label: 'Population', value: `${rec.population.toLocaleString()} Million` }
        ]);
      } else {
        Tooltip.show(event, countryName, [
          { label: 'Population', value: 'No data (Gray)' }
        ]);
      }
    })
    .on('mouseleave', function() {
      d3.select(this).attr('stroke', '#d1d5db').attr('stroke-width', 0.5);
      Tooltip.hide();
    });
}

// ==========================================================================
// TASK 5: Pakistan Cities Point Map
// ==========================================================================
function initPointMap(citiesData, geoData) {
  const container = document.getElementById('pointmap-container');
  if (!container) return;
  container.innerHTML = '';

  const width = 1000;
  const height = 600;

  const projection = d3.geoMercator()
    .center([69.3, 30.1])
    .scale(1950)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const maxPop = d3.max(citiesData, d => +d.pop) || 16.0;
  const areaRadiusScale = d3.scaleSqrt().domain([0, maxPop]).range([5, 26]);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background', '#ffffff');

  // White Ocean
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#ffffff');

  const g = svg.append('g');

  // Countries: Pakistan = solid soft blue (#e0f2fe), Neighbors = solid gray (#f3f4f6)
  g.selectAll('path.base-country')
    .data(geoData.features)
    .join('path')
    .attr('d', path)
    .attr('fill', d => {
      const code = (d.properties.adm0_a3 || d.properties.iso_a3 || d.id || '').toUpperCase();
      return code === 'PAK' ? '#e0f2fe' : '#f3f4f6';
    })
    .attr('stroke', d => {
      const code = (d.properties.adm0_a3 || d.properties.iso_a3 || d.id || '').toUpperCase();
      return code === 'PAK' ? '#0284c7' : '#d1d5db';
    })
    .attr('stroke-width', 0.8);

  // City Points
  const cityGroup = g.append('g');

  const cityNodes = cityGroup.selectAll('g.city-item')
    .data(citiesData)
    .join('g')
    .attr('transform', d => {
      const coords = projection([+d.lon, +d.lat]);
      return coords ? `translate(${coords[0]}, ${coords[1]})` : 'translate(-100,-100)';
    });

  // Solid flat coral circles with 0.6 opacity
  cityNodes.append('circle')
    .attr('r', d => areaRadiusScale(+d.pop))
    .attr('fill', '#ea580c')
    .attr('fill-opacity', 0.6)
    .attr('stroke', '#9a3412')
    .attr('stroke-width', 1.5)
    .on('mouseenter', (event, d) => {
      Tooltip.show(event, d.name, [
        { label: 'Population', value: `${(+d.pop).toFixed(2)} Million (${(d.pop * 1000000).toLocaleString()})` },
        { label: 'Coordinates', value: `Lat: ${d.lat}°, Lon: ${d.lon}°` },
        { label: 'Label Status', value: +d.pop >= 1.0 ? 'Labeled (> 1M)' : 'Tooltip only (< 1M)' }
      ]);
    })
    .on('mouseleave', () => Tooltip.hide());

  // Requirement: Label only cities with pop >= 1.0
  const majorCities = cityNodes.filter(d => +d.pop >= 1.0);

  function getLabelConfig(name, r) {
    if (name === 'Faisalabad' || name === 'Peshawar' || name === 'Quetta') {
      return { x: -r - 6, anchor: 'end' };
    }
    return { x: r + 6, anchor: 'start' };
  }

  majorCities.append('text')
    .attr('x', d => getLabelConfig(d.name, areaRadiusScale(+d.pop)).x)
    .attr('text-anchor', d => getLabelConfig(d.name, areaRadiusScale(+d.pop)).anchor)
    .attr('y', 4)
    .text(d => d.name)
    .style('font-size', '11.5px')
    .style('font-weight', 'bold')
    .style('fill', '#111827');
}

// ==========================================================================
// TASK 6: Combined Spatial Encoding Map
// ==========================================================================
function initCombinedMap(citiesData, flightsData, geoData) {
  const container = document.getElementById('combinedmap-container');
  if (!container) return;
  container.innerHTML = '';

  const width = 1000;
  const height = 600;

  const cityLookup = new Map();
  citiesData.forEach(c => {
    cityLookup.set(c.name.trim(), {
      name: c.name.trim(),
      lat: +c.lat,
      lon: +c.lon,
      pop: +c.pop,
      routes: 0,
      totalFlights: 0,
      destinations: []
    });
  });

  flightsData.forEach(f => {
    const src = cityLookup.get(f.source.trim());
    const tgt = cityLookup.get(f.target.trim());

    if (src && tgt) {
      src.routes += 1;
      src.totalFlights += +f.flights;
      src.destinations.push({ to: tgt.name, flights: +f.flights });

      tgt.routes += 1;
      tgt.totalFlights += +f.flights;
      tgt.destinations.push({ to: src.name, flights: +f.flights });
    }
  });

  const projection = d3.geoMercator()
    .center([69.3, 30.1])
    .scale(1950)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const maxPop = d3.max(citiesData, d => +d.pop) || 16.0;
  const popRadiusScale = d3.scaleSqrt().domain([0, maxPop]).range([5, 26]);

  const isHub = (routes) => routes >= 4;
  const hubColor = '#ea580c';     // Solid Orange for Hubs
  const nonHubColor = '#64748b';  // Solid Slate for Non-Hubs

  const flightExtent = d3.extent(flightsData, d => +d.flights) || [6, 70];
  const routeWidthScale = d3.scaleLinear().domain(flightExtent).range([1.5, 7.5]);

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .style('background', '#ffffff');

  // White Ocean
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#ffffff');

  const g = svg.append('g');

  // Map background
  g.selectAll('path.base-country')
    .data(geoData.features)
    .join('path')
    .attr('d', path)
    .attr('fill', d => {
      const code = (d.properties.adm0_a3 || d.properties.iso_a3 || d.id || '').toUpperCase();
      return code === 'PAK' ? '#e0f2fe' : '#f3f4f6';
    })
    .attr('stroke', d => {
      const code = (d.properties.adm0_a3 || d.properties.iso_a3 || d.id || '').toUpperCase();
      return code === 'PAK' ? '#0284c7' : '#d1d5db';
    })
    .attr('stroke-width', 0.8);

  // Routes drawn FIRST behind cities
  const routeGroup = g.append('g').attr('class', 'spatial-routes-layer');

  const routeLines = routeGroup.selectAll('line.spatial-route')
    .data(flightsData)
    .join('line')
    .attr('class', 'spatial-route')
    .attr('x1', d => {
      const c = cityLookup.get(d.source.trim());
      return c ? projection([c.lon, c.lat])[0] : 0;
    })
    .attr('y1', d => {
      const c = cityLookup.get(d.source.trim());
      return c ? projection([c.lon, c.lat])[1] : 0;
    })
    .attr('x2', d => {
      const c = cityLookup.get(d.target.trim());
      return c ? projection([c.lon, c.lat])[0] : 0;
    })
    .attr('y2', d => {
      const c = cityLookup.get(d.target.trim());
      return c ? projection([c.lon, c.lat])[1] : 0;
    })
    .attr('stroke-width', d => routeWidthScale(+d.flights))
    .on('mouseenter', (event, d) => {
      Tooltip.show(event, `${d.source} ↔ ${d.target}`, [
        { label: 'Weekly Flights', value: `${d.flights} flights/week` },
        { label: 'Encoding', value: 'Stroke Width = Flight Frequency' }
      ]);
    })
    .on('mouseleave', () => Tooltip.hide());

  // Cities drawn ON TOP of routes
  const cityGroup = g.append('g').attr('class', 'spatial-cities-layer');
  const citiesArray = Array.from(cityLookup.values());

  const cityElements = cityGroup.selectAll('g.spatial-city')
    .data(citiesArray)
    .join('g')
    .attr('transform', d => {
      const pt = projection([d.lon, d.lat]);
      return pt ? `translate(${pt[0]}, ${pt[1]})` : 'translate(-100,-100)';
    });

  // Solid flat circles
  cityElements.append('circle')
    .attr('r', d => popRadiusScale(d.pop))
    .attr('fill', d => isHub(d.routes) ? hubColor : nonHubColor)
    .attr('fill-opacity', 0.8)
    .attr('stroke', '#ffffff')
    .attr('stroke-width', 2);

  function getCombinedLabelConfig(name, r) {
    if (name === 'Faisalabad' || name === 'Peshawar' || name === 'Quetta') {
      return { x: -r - 6, anchor: 'end' };
    }
    return { x: r + 6, anchor: 'start' };
  }

  cityElements.append('text')
    .attr('x', d => getCombinedLabelConfig(d.name, popRadiusScale(d.pop)).x)
    .attr('text-anchor', d => getCombinedLabelConfig(d.name, popRadiusScale(d.pop)).anchor)
    .attr('y', 4)
    .text(d => d.name)
    .style('font-weight', d => isHub(d.routes) ? 'bold' : 'normal')
    .style('font-size', '11.5px')
    .style('fill', '#111827');

  // Interactivity
  cityElements
    .on('mouseenter', (event, city) => {
      const connectedCityNames = new Set();
      connectedCityNames.add(city.name);

      routeLines.each(function(r) {
        if (r.source === city.name || r.target === city.name) {
          connectedCityNames.add(r.source);
          connectedCityNames.add(r.target);
          d3.select(this)
            .classed('highlighted', true)
            .classed('dimmed', false);
        } else {
          d3.select(this)
            .classed('highlighted', false)
            .classed('dimmed', true);
        }
      });

      cityElements.each(function(c) {
        if (connectedCityNames.has(c.name)) {
          d3.select(this).style('opacity', 1);
        } else {
          d3.select(this).style('opacity', 0.15);
        }
      });

      const destSummary = city.destinations.map(d => `${d.to} (${d.flights}/wk)`).join(', ');
      Tooltip.show(event, city.name, [
        { label: 'Role', value: isHub(city.routes) ? 'Primary Hub (≥ 4 routes)' : 'Standard City' },
        { label: 'Population', value: `${city.pop} Million` },
        { label: 'Routes', value: `${city.routes} connected cities` },
        { label: 'Weekly Outbound', value: `${city.totalFlights} flights/week` },
        { label: 'Destinations', value: destSummary || 'None' }
      ]);
    })
    .on('mouseleave', () => {
      routeLines.classed('highlighted', false).classed('dimmed', false);
      cityElements.style('opacity', 1);
      Tooltip.hide();
    });
}

// ==========================================================================
// Initialization & Tab Controller
// ==========================================================================
async function initApplication() {
  Tooltip.init();
  setupNavigationTabs();

  try {
    const [university, flights, cities, population, geoWorld] = await Promise.all([
      d3.csv('university.csv', d3.autoType),
      d3.csv('flights.csv', d3.autoType),
      d3.csv('pakistan_cities.csv', d3.autoType),
      d3.csv('population.csv', d3.autoType),
      d3.json('custom.geo.json')
    ]);

    AppState.university = university;
    AppState.flights = flights;
    AppState.cities = cities;
    AppState.population = population;
    AppState.geoWorld = geoWorld;

    renderCurrentTask('task1');

  } catch (err) {
    console.error('Error loading datasets:', err);
  }
}

function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const taskId = tab.dataset.task;
      AppState.activeTask = taskId;

      document.querySelectorAll('.task-section').forEach(sec => {
        sec.classList.remove('active');
      });

      const activeSec = document.getElementById(taskId);
      if (activeSec) {
        activeSec.classList.add('active');
        renderCurrentTask(taskId);
      }
    });
  });
}

function renderCurrentTask(taskId) {
  if (!AppState.university) return;

  switch (taskId) {
    case 'task1':
      initTreemap(AppState.university);
      break;
    case 'task2':
      initDendrogram(AppState.university);
      break;
    case 'task3':
      initNetworkGraph(AppState.flights);
      break;
    case 'task4':
      initChoroplethMap(AppState.population, AppState.geoWorld);
      break;
    case 'task5':
      initPointMap(AppState.cities, AppState.geoWorld);
      break;
    case 'task6':
      initCombinedMap(AppState.cities, AppState.flights, AppState.geoWorld);
      break;
  }
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (AppState.activeTask) {
      renderCurrentTask(AppState.activeTask);
    }
  }, 250);
});

document.addEventListener('DOMContentLoaded', initApplication);
