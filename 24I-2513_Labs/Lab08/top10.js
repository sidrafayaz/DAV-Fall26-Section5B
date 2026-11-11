const margin = {top: 15, right: 75, bottom: 50, left: 135};
const width = 850 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;
const svg = d3.select('#top-chart').append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);
const x = d3.scaleLinear().range([0, width]);
const y = d3.scaleBand().range([0, height]).padding(0.2);
const color = d3.scaleOrdinal()
  .domain(['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'])
  .range(['#b279a2', '#59a14f', '#f28e2b', '#4e79a7', '#e15759']);
const xAxis = svg.append('g').attr('transform', `translate(0,${height})`);
const yAxis = svg.append('g');
svg.append('text').attr('x', width / 2).attr('y', height + 43)
  .attr('text-anchor', 'middle').text('GDP per capita (international $)');
const tooltip = d3.select('body').append('div').attr('id', 'tooltip').style('display', 'none');

d3.csv('dataset/gapminder.csv', d3.autoType).then(data => {
  // Remove missing or invalid values and duplicate country-year rows.
  const seen = new Set();
  data = data.filter(d => {
    const key = d.country + '-' + d.year;
    if (!d.country || !d.continent || !Number.isFinite(d.year) ||
        !Number.isFinite(d.gdpPercap) || d.gdpPercap <= 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  function update(year) {
    const top10 = data.filter(d => d.year === year)
      .sort((a, b) => b.gdpPercap - a.gdpPercap).slice(0, 10);
    x.domain([0, d3.max(top10, d => d.gdpPercap)]).nice();
    y.domain(top10.map(d => d.country));
    const transition = svg.transition().duration(800);
    xAxis.transition(transition).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('~s')));
    yAxis.transition(transition).call(d3.axisLeft(y));

    svg.selectAll('rect').data(top10, d => d.country).join(
      enter => enter.append('rect').attr('x', 0)
        .attr('y', d => y(d.country)).attr('width', 0).attr('height', y.bandwidth()),
      update => update,
      exit => exit.transition(transition).attr('width', 0).remove()
    )
      .attr('fill', d => color(d.continent))
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block').text(`${d.country}: ${d3.format(',.0f')(d.gdpPercap)}`);
      })
      .on('mousemove', event => tooltip.style('left', (event.pageX + 12) + 'px')
        .style('top', (event.pageY + 12) + 'px'))
      .on('mouseout', () => tooltip.style('display', 'none'))
      .transition(transition).attr('y', d => y(d.country))
      .attr('width', d => x(d.gdpPercap)).attr('height', y.bandwidth());

    const continents = [...new Set(top10.map(d => d.continent))];
    d3.select('#legend').selectAll('span').data(continents).join('span')
      .html(d => `<i style="background:${color(d)}"></i>${d}`);
    d3.select('#chart-title').text('Top 10 countries in ' + year);
    d3.select('#result').text(`${top10[0].country} is first: ${d3.format(',.0f')(top10[0].gdpPercap)}.`);
    d3.select('#year1952').attr('aria-pressed', year === 1952);
    d3.select('#year2007').attr('aria-pressed', year === 2007);
  }
  d3.select('#year1952').on('click', () => update(1952));
  d3.select('#year2007').on('click', () => update(2007));
  update(2007);
}).catch(error => {
  d3.select('#result').text('Could not load the dataset. Run this folder through a local server.');
  console.error(error);
});
