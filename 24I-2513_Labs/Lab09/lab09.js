const DATA = {
  university: 'dataset/university.csv',
  flights: 'dataset/flights.csv',
  population: 'dataset/population.csv',
  cities: 'dataset/pakistan_cities.csv',
  world: 'dataset/custom.geo.json'
};

const palette = ['#276b58', '#d26a38', '#507ca8', '#9a6a9f'];
const tooltip = d3.select('#tooltip');
const showTip = (event, html) => tooltip.html(html).style('opacity', 1)
  .style('left', `${Math.min(event.clientX + 14, window.innerWidth - 275)}px`)
  .style('top', `${Math.min(event.clientY + 14, window.innerHeight - 90)}px`);
const moveTip = event => tooltip.style('left', `${Math.min(event.clientX + 14, window.innerWidth - 275)}px`)
  .style('top', `${Math.min(event.clientY + 14, window.innerHeight - 90)}px`);
const hideTip = () => tooltip.style('opacity', 0);

function hierarchyFrom(rows) {
  return {
    name: 'University',
    children: Array.from(d3.group(rows, d => d.department), ([name, courses]) => ({
      name,
      children: courses.map(d => ({ name: d.course, department: d.department, students: d.students }))
    }))
  };
}

function departmentLegend(departments) {
  const color = d3.scaleOrdinal(departments, palette);
  d3.select('#department-legend').selectAll('span').data(departments).join('span')
    .html(d => `<i style="background:${color(d)}"></i>${d}`);
  return color;
}

function drawTreemap(rows, color) {
  const width = 1100, height = 520;
  const svg = d3.select('#treemap').attr('viewBox', [0, 0, width, height]);
  const root = d3.hierarchy(hierarchyFrom(rows)).sum(d => d.students || 0).sort((a, b) => b.value - a.value);
  d3.treemap().size([width, height]).paddingOuter(3).paddingTop(25).paddingInner(4).round(true)(root);

  const departments = svg.selectAll('g.department').data(root.children).join('g').attr('class', 'department');
  departments.append('text').attr('x', d => d.x0 + 9).attr('y', d => d.y0 + 17)
    .attr('fill', '#4c5b56').attr('font-weight', 750).text(d => `${d.data.name} · ${d.value}`);

  const leaves = departments.selectAll('g.course').data(d => d.leaves()).join('g').attr('class', 'course')
    .attr('transform', d => `translate(${d.x0},${d.y0})`)
    .on('mouseenter', (event, d) => showTip(event, `<strong>${d.data.name}</strong><br>${d.data.department}<br>${d.value} students`))
    .on('mousemove', moveTip).on('mouseleave', hideTip);
  leaves.append('rect').attr('width', d => d.x1 - d.x0).attr('height', d => d.y1 - d.y0)
    .attr('rx', 5).attr('fill', d => color(d.data.department)).attr('fill-opacity', .9);
  leaves.append('text').attr('x', 9).attr('y', 20).attr('fill', '#fff').attr('font-weight', 700)
    .text(d => d.data.name).each(function(d) {
      const maxWidth = d.x1 - d.x0 - 18;
      if (this.getComputedTextLength() > maxWidth) {
        let label = d.data.name;
        while (label.length > 2 && this.getComputedTextLength() > maxWidth) { label = label.slice(0, -1); this.textContent = `${label}…`; }
      }
    });
  leaves.append('text').attr('x', 9).attr('y', 38).attr('fill', '#fff').attr('fill-opacity', .85)
    .text(d => `${d.value} students`);
}

function drawDendrogram(rows) {
  const width = 1100, height = 530, margin = { top: 26, right: 190, bottom: 26, left: 140 };
  const svg = d3.select('#dendrogram').attr('viewBox', [0, 0, width, height]);
  const root = d3.hierarchy(hierarchyFrom(rows));
  root.x0 = (height - margin.top - margin.bottom) / 2; root.y0 = 0;
  let nodeId = 0;

  function update(source) {
    const visible = root.descendants();
    d3.cluster().size([height - margin.top - margin.bottom, width - margin.left - margin.right])(root);
    const transition = svg.transition().duration(450);
    const links = svg.selectAll('path.tree-link').data(root.links(), d => d.target.id || (d.target.id = ++nodeId));
    links.join(
      enter => enter.append('path').attr('class', 'tree-link').attr('fill', 'none').attr('stroke', '#b7c2bd').attr('stroke-width', 1.5)
        .attr('d', () => `M${source.y0 + margin.left},${source.x0 + margin.top}C${source.y0 + margin.left},${source.x0 + margin.top} ${source.y0 + margin.left},${source.x0 + margin.top} ${source.y0 + margin.left},${source.x0 + margin.top}`),
      update => update,
      exit => exit.transition(transition).attr('opacity', 0).remove()
    ).transition(transition).attr('d', d => `M${d.source.y + margin.left},${d.source.x + margin.top}C${(d.source.y + d.target.y) / 2 + margin.left},${d.source.x + margin.top} ${(d.source.y + d.target.y) / 2 + margin.left},${d.target.x + margin.top} ${d.target.y + margin.left},${d.target.x + margin.top}`);

    const nodes = svg.selectAll('g.tree-node').data(visible, d => d.id || (d.id = ++nodeId));
    const entered = nodes.enter().append('g').attr('class', 'tree-node').attr('cursor', d => d.depth === 1 ? 'pointer' : 'default')
      .attr('transform', `translate(${source.y0 + margin.left},${source.x0 + margin.top})`)
      .on('click', (event, d) => { if (d.depth !== 1) return; d.children = d.children ? null : d._children; update(d); });
    entered.append('circle').attr('r', 0).attr('stroke', '#fffdf8').attr('stroke-width', 2);
    entered.append('text').attr('dy', '.32em').attr('font-weight', d => d.depth < 2 ? 700 : 500)
      .attr('text-anchor', d => d.children || d._children ? 'end' : 'start').attr('x', d => d.children || d._children ? -11 : 11).text(d => d.data.name);
    entered.merge(nodes).transition(transition).attr('transform', d => `translate(${d.y + margin.left},${d.x + margin.top})`);
    entered.merge(nodes).select('circle').transition(transition).attr('r', d => d.depth === 0 ? 8 : 6)
      .attr('fill', d => ['#173f35', '#d26a38', '#7eaa9c'][d.depth]);
    entered.merge(nodes).select('text').attr('text-anchor', d => d.children || d._children ? 'end' : 'start').attr('x', d => d.children || d._children ? -11 : 11);
    nodes.exit().transition(transition).attr('opacity', 0).attr('transform', `translate(${source.y + margin.left},${source.x + margin.top})`).remove();
    root.each(d => { d.x0 = d.x; d.y0 = d.y; if (d.depth === 1 && !d._children) d._children = d.children; });
  }
  update(root);
}

function routeDegrees(flights) {
  const degree = new Map();
  flights.forEach(d => { degree.set(d.source, (degree.get(d.source) || 0) + 1); degree.set(d.target, (degree.get(d.target) || 0) + 1); });
  return degree;
}

function drawNetwork(flights) {
  const width = 1100, height = 570;
  const svg = d3.select('#network').attr('viewBox', [0, 0, width, height]);
  const degree = routeDegrees(flights);
  const nodes = Array.from(new Set(flights.flatMap(d => [d.source, d.target])), id => ({ id, degree: degree.get(id) }));
  const links = flights.map(d => ({ ...d }));
  const radius = d3.scaleSqrt().domain(d3.extent(nodes, d => d.degree)).range([9, 24]);
  const widthScale = d3.scaleLinear().domain(d3.extent(links, d => d.flights)).range([1.5, 9]);
  const link = svg.append('g').selectAll('line').data(links).join('line').attr('stroke', '#9aa9a4').attr('stroke-opacity', .55).attr('stroke-width', d => widthScale(d.flights));
  const node = svg.append('g').selectAll('g').data(nodes).join('g').attr('cursor', 'grab')
    .on('mouseenter', (event, d) => {
      link.attr('stroke-opacity', l => l.source.id === d.id || l.target.id === d.id ? .95 : .08).attr('stroke', l => l.source.id === d.id || l.target.id === d.id ? '#d26a38' : '#9aa9a4');
      node.attr('opacity', n => n.id === d.id || links.some(l => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)) ? 1 : .18);
      showTip(event, `<strong>${d.id}</strong><br>${d.degree} routes`);
    }).on('mousemove', moveTip).on('mouseleave', () => { link.attr('stroke-opacity', .55).attr('stroke', '#9aa9a4'); node.attr('opacity', 1); hideTip(); });
  node.append('circle').attr('r', d => radius(d.degree)).attr('fill', '#276b58').attr('stroke', '#fffdf8').attr('stroke-width', 3);
  node.append('text').attr('class', 'node-label').attr('text-anchor', 'middle').attr('dy', d => radius(d.degree) + 15).attr('font-weight', 650).text(d => d.id);
  const simulation = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id(d => d.id).distance(145).strength(.55))
    .force('charge', d3.forceManyBody().strength(-440)).force('center', d3.forceCenter(width / 2, height / 2)).force('collide', d3.forceCollide(d => radius(d.degree) + 35));
  node.call(d3.drag().on('start', (event, d) => { if (!event.active) simulation.alphaTarget(.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; }).on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));
  simulation.on('tick', () => {
    nodes.forEach(d => { d.x = Math.max(55, Math.min(width - 55, d.x)); d.y = Math.max(45, Math.min(height - 55, d.y)); });
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

function populationLegend(scale, max) {
  const stops = d3.range(0, 1.01, .1).map(t => `${scale(max * t)} ${t * 100}%`).join(',');
  d3.select('#population-legend').html(`<div class="gradient" style="background:linear-gradient(90deg,${stops})"></div><div class="gradient-labels"><span>0 million</span><span>${d3.format(',')(max)} million</span></div>`);
}

function drawWorldMap(world, population) {
  const width = 1100, height = 540;
  const svg = d3.select('#world-map').attr('viewBox', [0, 0, width, height]);
  const pop = new Map(population.map(d => [d.id, d]));
  const max = d3.max(population, d => d.population_millions);
  const color = d3.scaleSequentialSqrt([0, max], d3.interpolateYlGnBu);
  const projection = d3.geoNaturalEarth1().fitExtent([[8, 8], [width - 8, height - 8]], world);
  const path = d3.geoPath(projection);
  populationLegend(color, max);
  svg.selectAll('path').data(world.features).join('path').attr('class', 'country').attr('d', path)
    .attr('fill', d => pop.has(d.properties.adm0_a3) ? color(pop.get(d.properties.adm0_a3).population_millions) : '#deded8')
    .on('mouseenter', function(event, d) { d3.select(this).raise().attr('stroke', '#18201e').attr('stroke-width', 1.8); const row = pop.get(d.properties.adm0_a3); showTip(event, `<strong>${d.properties.name}</strong><br>${row ? `${d3.format(',')(row.population_millions)} million` : 'No population data'}`); })
    .on('mousemove', moveTip).on('mouseleave', function() { d3.select(this).attr('stroke', '#fffdf8').attr('stroke-width', .5); hideTip(); });
}

function pakistanFeature(world) { return world.features.find(d => d.properties.adm0_a3 === 'PAK' || d.properties.name === 'Pakistan'); }

function pakistanProjection(feature, width, height) {
  return d3.geoMercator().center([69.5, 30.5]).fitExtent([[85, 45], [width - 85, height - 45]], feature);
}

function drawCitiesMap(world, cities) {
  const width = 1100, height = 600;
  const svg = d3.select('#cities-map').attr('viewBox', [0, 0, width, height]);
  const pakistan = pakistanFeature(world); const projection = pakistanProjection(pakistan, width, height); const path = d3.geoPath(projection);
  svg.append('path').datum(pakistan).attr('class', 'map-land').attr('d', path).attr('fill', '#dde8e1').attr('stroke', '#6a7e77');
  const radius = d3.scaleSqrt([0, d3.max(cities, d => d.pop)], [3, 36]);
  const points = svg.append('g').selectAll('g').data(cities).join('g').attr('transform', d => `translate(${projection([d.lon, d.lat])})`)
    .on('mouseenter', (event, d) => showTip(event, `<strong>${d.name}</strong><br>${d3.format('.2~f')(d.pop)} million residents`)).on('mousemove', moveTip).on('mouseleave', hideTip);
  points.append('circle').attr('r', d => radius(d.pop)).attr('fill', '#d26a38').attr('fill-opacity', .58).attr('stroke', '#a34620').attr('stroke-width', 1.2);
  points.filter(d => d.pop > 1).append('text').attr('class', 'city-label').attr('x', d => radius(d.pop) + 6).attr('dy', '.32em').attr('font-weight', 650).text(d => d.name);
}

function drawCombinedMap(world, cities, flights) {
  const width = 1100, height = 600;
  const svg = d3.select('#combined-map').attr('viewBox', [0, 0, width, height]);
  const pakistan = pakistanFeature(world); const projection = pakistanProjection(pakistan, width, height); const path = d3.geoPath(projection);
  const cityByName = new Map(cities.map(d => [d.name, d])); const degree = routeDegrees(flights);
  const routeWidth = d3.scaleLinear(d3.extent(flights, d => d.flights), [1.2, 8]); const radius = d3.scaleSqrt([0, d3.max(cities, d => d.pop)], [3, 30]);
  svg.append('path').datum(pakistan).attr('class', 'map-land').attr('d', path);
  const route = svg.append('g').selectAll('line').data(flights.filter(d => cityByName.has(d.source) && cityByName.has(d.target))).join('line').attr('class', 'route')
    .attr('x1', d => projection([cityByName.get(d.source).lon, cityByName.get(d.source).lat])[0]).attr('y1', d => projection([cityByName.get(d.source).lon, cityByName.get(d.source).lat])[1])
    .attr('x2', d => projection([cityByName.get(d.target).lon, cityByName.get(d.target).lat])[0]).attr('y2', d => projection([cityByName.get(d.target).lon, cityByName.get(d.target).lat])[1])
    .attr('stroke', '#527d89').attr('stroke-opacity', .5).attr('stroke-width', d => routeWidth(d.flights));
  const city = svg.append('g').selectAll('g').data(cities).join('g').attr('transform', d => `translate(${projection([d.lon, d.lat])})`)
    .on('mouseenter', (event, d) => {
      const hasRoute = r => r.source === d.name || r.target === d.name;
      route.attr('stroke-opacity', r => hasRoute(r) ? .95 : .06).attr('stroke', r => hasRoute(r) ? '#d26a38' : '#527d89'); city.attr('opacity', c => c.name === d.name || flights.some(r => hasRoute(r) && (r.source === c.name || r.target === c.name)) ? 1 : .2);
      showTip(event, `<strong>${d.name}</strong><br>${d3.format('.2~f')(d.pop)} million residents<br>${degree.get(d.name) || 0} routes · ${(degree.get(d.name) || 0) >= 4 ? 'Hub' : 'Non-hub'}`);
    }).on('mousemove', moveTip).on('mouseleave', () => { route.attr('stroke-opacity', .5).attr('stroke', '#527d89'); city.attr('opacity', 1); hideTip(); });
  city.append('circle').attr('r', d => radius(d.pop)).attr('fill', d => (degree.get(d.name) || 0) >= 4 ? '#d26a38' : '#276b58').attr('fill-opacity', .8).attr('stroke', '#fffdf8').attr('stroke-width', 2);
  city.append('text').attr('class', 'city-label').attr('x', d => radius(d.pop) + 6).attr('dy', '.32em').attr('font-weight', 650).text(d => d.name);
  d3.select('#combined-legend').html('<span><i style="background:#d26a38;border-radius:50%"></i>Hub (4+ routes)</span><span><i style="background:#276b58;border-radius:50%"></i>Non-hub</span><span>◯ Circle area = population</span><span>━ Line width = weekly flights</span><span>⌖ Position = coordinates</span>');
}

Promise.all([
  d3.csv(DATA.university, d3.autoType), d3.csv(DATA.flights, d3.autoType), d3.csv(DATA.population, d3.autoType),
  d3.csv(DATA.cities, d3.autoType), d3.json(DATA.world)
]).then(([university, flights, population, cities, world]) => {
  const departments = Array.from(new Set(university.map(d => d.department)));
  const colors = departmentLegend(departments);
  drawTreemap(university, colors); drawDendrogram(university); drawNetwork(flights); drawWorldMap(world, population);
  drawCitiesMap(world, cities); drawCombinedMap(world, cities, flights);
}).catch(error => {
  console.error(error);
  d3.select('main').prepend('p').attr('class', 'load-error').text('The datasets could not be loaded. Run this folder through a local web server.');
});
