const margin = {top: 20, right: 30, bottom: 50, left: 110};
const width = 900 - margin.left - margin.right;

d3.csv('dataset/gapminder.csv', d3.autoType).then(data => {
  function draw(mode) {
    let rows = data;
    let height = 400;
    if (mode !== 'original') rows = data.filter(d => d.year === 2007);
    if (mode === 'readable') height = rows.length * 22;
    if (mode === 'top10') {
      rows = rows.slice().sort((a, b) => b.gdpPercap - a.gdpPercap).slice(0, 10);
    }
    const root = d3.select('#bars').attr('width', 900)
      .attr('height', height + margin.top + margin.bottom);
    root.selectAll('*').remove();
    const svg = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, d3.max(rows, d => d.gdpPercap)])
      .range([0, width]);
    const y = d3.scaleBand().domain(rows.map(d => d.country))
      .range([0, height]).padding(0.1);
    svg.append('g').call(d3.axisLeft(y)).selectAll('text').style('font-size', '8.5px');
    svg.append('g').attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('~s')));
    svg.selectAll('rect').data(rows).join('rect')
      .attr('x', 0).attr('y', d => y(d.country))
      .attr('width', d => x(d.gdpPercap)).attr('height', y.bandwidth())
      .attr('fill', 'steelblue')
      .append('title').text(d => `${d.country} (${d.year}): ${d3.format(',.0f')(d.gdpPercap)}`);
    svg.append('text').attr('x', width / 2).attr('y', height + 43)
      .attr('text-anchor', 'middle').text('GDP per capita (international $)');
    d3.select('#status').text(`${rows.length} rectangles; bar height: ${y.bandwidth().toFixed(2)} px. ` +
      (mode === 'original' ? 'All years overlap at the same country positions.' : 'Year: 2007.'));
    d3.selectAll('button').attr('aria-pressed', function() { return this.id === mode; });
  }
  for (const mode of ['original', 'year', 'readable', 'top10']) {
    d3.select('#' + mode).on('click', () => draw(mode));
  }
  draw('original');
}).catch(error => {
  d3.select('#status').text('Could not load CSV. Open using a local server.');
  console.error(error);
});
