// Lab 10: local CSV and D3 v7. Missing dates are kept as gaps, not zeros.
const W = 960, H = 300, left = 65, right = 30, marginTop = 35, bottom = 40;
const parse = d3.timeParse('%Y-%m-%d');
const dateLabel = d3.timeFormat('%d %b');
const monthLabel = d3.timeFormat('%B');
const blue = '#2166ac', orange = '#b35806';

function section(title, note) {
  const s = d3.select('#charts').append('section');
  s.append('h2').text(title);
  if (note) s.append('p').text(note);
  return s;
}
function chart(s, label, height = H) {
  const svg = s.append('svg').attr('viewBox', `0 0 ${W} ${height}`)
    .attr('role', 'img').attr('aria-label', label);
  svg.append('title').text(label);
  return svg;
}
function axes(svg, x, y, label = 'PM2.5 (µg/m³)') {
  svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${H-bottom})`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(d3.timeFormat('%b')));
  svg.append('g').attr('transform', `translate(${left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('text').attr('x', left).attr('y', 16).text(label);
}
function line(svg, rows, x, y, key, color, width = 1.5, opacity = 1) {
  return svg.append('path').datum(rows).attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', width).attr('opacity', opacity)
    .attr('d', d3.line().defined(d => Number.isFinite(d[key])).x(d => x(d.date)).y(d => y(d[key])));
}

async function main() {
  const rows = await d3.csv('dataset/air_quality_2025.csv', d => ({
    date: parse(d.date), city: +d.pm25_city, suburb: +d.pm25_suburb, temp: +d.temp_c
  }));
  rows.sort((a,b) => a.date-b.date);
  if (!rows.length || rows.some(d => !d.date || ![d.city,d.suburb,d.temp].every(Number.isFinite))) {
    throw new Error('Invalid CSV data');
  }
  const start = parse('2025-01-01'), end = parse('2025-12-31');
  const byDate = new Map(rows.map(d => [+d.date, d]));
  const days = d3.timeDays(start, d3.timeDay.offset(end, 1)).map(date => byDate.get(+date) || {date, city: NaN, suburb: NaN});
  const missing = days.filter(d => !Number.isFinite(d.city));
  // A full seven consecutive readings are required; restart after the outage.
  days.forEach((d,i) => {
    const window = days.slice(Math.max(0,i-6),i+1);
    d.average = window.length === 7 && window.every(v => Number.isFinite(v.city)) ? d3.mean(window,v => v.city) : NaN;
  });
  const above15 = rows.filter(d => d.city > 15).length;
  const above75 = rows.filter(d => d.city > 75).length;
  const totals = d3.cumsum(days, d => Number.isFinite(d.city) && d.city > 75 ? 1 : 0);
  days.forEach((d,i) => d.total = totals[i]);
  const groups = d3.group(rows, d => d.date.getMonth());
  const levels = ['Low','Moderate','High','Severe'];
  const colors = ['#c6dbef','#6baed6','#2171b5','#08306b'];
  const level = v => v <= 35 ? 'Low' : v <= 75 ? 'Moderate' : v <= 150 ? 'High' : 'Severe';
  const months = d3.range(12).map(m => {
    const r = groups.get(m) || [];
    return {date: new Date(2025,m,1), count: r.length, min: d3.min(r,d=>d.city), max: d3.max(r,d=>d.city),
      mean: d3.mean(r,d=>d.city), difference: d3.mean(r,d=>d.city-d.suburb),
      unhealthy: r.filter(d=>d.city>75).length,
      ...Object.fromEntries(levels.map(l => [l,r.filter(d=>level(d.city)===l).length]))};
  });
  const x = d3.scaleTime().domain([start,end]).range([left,W-right]);
  const y = d3.scaleLinear().domain([0,d3.max(rows,d=>Math.max(d.city,d.suburb))*1.1]).nice().range([H-bottom,marginTop]);
  section('Task 1: Check the data', `${rows.length} rows, from ${dateLabel(rows[0].date)} to ${dateLabel(rows.at(-1).date)} 2025. There are 365 days in 2025, so ${missing.length} days are missing (12–20 March).`);

  let s = section('Task 2: Daily city PM2.5', `${above15} recorded days above 15 µg/m³; ${above75} above 75 µg/m³.`);
  let svg = chart(s,'Daily city PM2.5 with guidelines and two highest days');
  axes(svg,x,y); line(svg,days,x,y,'city',blue);
  [15,75].forEach(v => {
    svg.append('line').attr('x1',left).attr('x2',W-right).attr('y1',y(v)).attr('y2',y(v)).attr('stroke','#666').attr('stroke-dasharray','5 4');
    svg.append('text').attr('x',left+8).attr('y',y(v)-5).text(`${v === 15 ? 'WHO guideline' : 'Interim target 1'}: ${v}`);
  });
  const peaks = [...rows].sort((a,b)=>b.city-a.city).slice(0,2);
  peaks.forEach(d => {
    svg.append('circle').attr('cx',x(d.date)).attr('cy',y(d.city)).attr('r',4).attr('fill','#a00');
    svg.append('text').attr('x',x(d.date)).attr('y',y(d.city)-10).attr('text-anchor','middle').text(`${dateLabel(d.date)}: ${d.city}`);
  });

  s = section('Task 3: Running total of unhealthy days', `Only observed days above 75 are counted. Final total: ${above75}. Missing days are unknown; no increase is assumed.`);
  svg = chart(s,'Cumulative observed days above 75');
  const yc = d3.scaleLinear().domain([0,above75]).nice().range([H-bottom,marginTop]);
  axes(svg,x,yc,'Recorded days above 75');
  svg.append('path').datum(days).attr('fill','#9ecae1').attr('d',d3.area().x(d=>x(d.date)).y0(yc(0)).y1(d=>yc(d.total)).curve(d3.curveStepAfter));

  s = section('Task 4: City and suburb', 'Blue: city centre. Orange: suburb. Both use the same scale.');
  svg = chart(s,'City and suburb daily PM2.5'); axes(svg,x,y);
  line(svg,days,x,y,'city',blue); line(svg,days,x,y,'suburb',orange);

  s = section('Task 5: Monthly pollution levels', 'Recorded days only. Low ≤35; Moderate >35–75; High >75–150; Severe >150. These continuous boundaries also classify decimal readings. February has 28 days; March has only 22 readings because 9 are missing.');
  const legend = s.append('p');
  levels.forEach((l,i)=>legend.append('span').style('color',colors[i]).style('background',i===0?'#333':null).style('padding','4px 8px').text(`■ ${l} `));
  svg = chart(s,'Stacked monthly counts by pollution level');
  const xm = d3.scaleTime().domain(d3.extent(months,d=>d.date)).range([left,W-right]);
  const ym = d3.scaleLinear().domain([0,31]).range([H-bottom,marginTop]); axes(svg,xm,ym,'Recorded days');
  svg.selectAll('.layer').data(d3.stack().keys(levels)(months)).join('path').attr('class','layer').attr('fill',(d,i)=>colors[i])
    .attr('d',d3.area().x(d=>xm(d.data.date)).y0(d=>ym(d[0])).y1(d=>ym(d[1])));
  months.forEach(d=>svg.append('text').attr('x',xm(d.date)).attr('y',ym(d.count)-6).attr('text-anchor','middle').text(d.count));

  s = section('Task 6: Month and weekday heatmap', 'Each cell is the mean city PM2.5 for that month and weekday. Hover for the value.');
  svg = chart(s,'Mean PM2.5 by month and weekday',340);
  const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const bx = d3.scaleBand().domain(d3.range(12)).range([left,W-right]).padding(.03);
  const by = d3.scaleBand().domain(d3.range(7)).range([marginTop,260]).padding(.03);
  const cells = d3.cross(d3.range(12),d3.range(7)).map(([m,w])=>({m,w,value:d3.mean(groups.get(m).filter(d=>(d.date.getDay()+6)%7===w),d=>d.city)}));
  const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0,d3.max(cells,d=>d.value)]);
  svg.append('g').attr('transform','translate(0,260)').call(d3.axisBottom(bx).tickFormat(m=>d3.timeFormat('%b')(new Date(2025,m,1))));
  svg.append('g').attr('transform',`translate(${left},0)`).call(d3.axisLeft(by).tickFormat(w=>weekdays[w]));
  const heatmapValue = s.append('p').attr('id', 'heatmap-value').attr('aria-live', 'polite').text('Hover over or tap a cell to see its average.');
  const cellLabel = d => `${monthLabel(new Date(2025,d.m,1))}, ${weekdays[d.w]}: ${d.value.toFixed(1)} µg/m³`;
  svg.selectAll('.cell').data(cells).join('rect').attr('class','cell').attr('x',d=>bx(d.m)).attr('y',d=>by(d.w)).attr('width',bx.bandwidth()).attr('height',by.bandwidth()).attr('fill',d=>color(d.value))
    .attr('tabindex', 0).attr('aria-label', cellLabel).style('cursor', 'pointer')
    .on('pointerenter focus click', (event, d) => heatmapValue.text(cellLabel(d)))
    .append('title').text(cellLabel);
  d3.range(100).forEach(i=>svg.append('rect').attr('x',left+i*3).attr('y',298).attr('width',3).attr('height',12).attr('fill',color(color.domain()[1]*i/99)));
  svg.append('text').attr('x',left).attr('y',330).text(`0                         ${color.domain()[1].toFixed(1)} µg/m³ (light to dark)`);

  s = section('Task 7: Monthly minimum, maximum and mean', 'Shading: minimum to maximum. Blue line: monthly mean.');
  svg = chart(s,'Monthly PM2.5 range and mean'); axes(svg,xm,y);
  svg.append('path').datum(months).attr('fill','#c6dbef').attr('d',d3.area().x(d=>xm(d.date)).y0(d=>y(d.min)).y1(d=>y(d.max)));
  line(svg,months,xm,y,'mean',blue,2.5);

  s = section('Task 8: Moving average and missing data', 'Faint line: daily city PM2.5. Dark line: trailing 7-day mean (requires all seven days). 9 days are missing, 12–20 March. The average restarts on 27 March after seven new readings.');
  svg = chart(s,'Daily PM2.5 and seven-day average with sensor outage'); axes(svg,x,y);
  svg.append('rect').attr('x',x(missing[0].date)).attr('y',marginTop).attr('width',x(d3.timeDay.offset(missing.at(-1).date,1))-x(missing[0].date)).attr('height',H-bottom-marginTop).attr('fill','#ddd');
  svg.append('text').attr('x',x(missing[0].date)-20).attr('y',marginTop+15).text('No data: sensor offline');
  line(svg,days,x,y,'city',blue,1,.35); line(svg,days,x,y,'average','#17365d',3);

  s = section('Task 9: Explore a period', 'Drag across the small overview to zoom. Hover on the main chart for the nearest recorded reading. A month selector is also available for keyboard use.');
  const controls = s.append('p');
  controls.append('label').attr('for','month').text('Month: ');
  const select = controls.append('select').attr('id','month');
  select.append('option').attr('value','all').text('Full year');
  months.forEach((d,i)=>select.append('option').attr('value',i).text(monthLabel(d.date)));
  const reset = controls.append('button').text('Reset');
  const period = s.append('p').attr('id','period');
  const hover = s.append('p').attr('id','reading').text('Hover over the main chart for a reading.');
  svg = chart(s,'Zoomable daily city PM2.5'); axes(svg,x,y);
  svg.append('defs').append('clipPath').attr('id','zoom-clip').append('rect').attr('x',left).attr('y',marginTop).attr('width',W-left-right).attr('height',H-marginTop-bottom);
  const path = line(svg,days,x,y,'city',blue).attr('clip-path','url(#zoom-clip)');
  const zx = x.copy();
  const marker = svg.append('circle').attr('r',4).attr('fill','#a00').attr('display','none');
  svg.append('rect').attr('x',left).attr('y',marginTop).attr('width',W-left-right).attr('height',H-marginTop-bottom).attr('fill','transparent')
    .on('mousemove',function(event){
      const date = zx.invert(d3.pointer(event,this)[0]);
      const d = days[d3.bisector(d=>d.date).center(days,date)];
      hover.text(`${dateLabel(d.date)}: ${Number.isFinite(d.city)?d.city+' µg/m³':'No data: sensor offline'}`);
      marker.attr('display',Number.isFinite(d.city)?null:'none').attr('cx',zx(d.date)).attr('cy',Number.isFinite(d.city)?y(d.city):0);
    }).on('mouseleave',()=>marker.attr('display','none'));
  const overview = chart(s,'Brush overview: select a time range',100);
  const yo = y.copy().range([65,10]);
  line(overview,days,x,yo,'city',blue);
  overview.append('g').attr('transform','translate(0,65)').call(d3.axisBottom(x).ticks(12).tickFormat(d3.timeFormat('%b')));
  function update(domain) {
    zx.domain(domain); marker.attr('display','none');
    svg.select('.x-axis').call(d3.axisBottom(zx).ticks(8).tickFormat(d3.timeFormat('%d %b')));
    path.attr('d',d3.line().defined(d=>Number.isFinite(d.city)).x(d=>zx(d.date)).y(d=>y(d.city)));
    period.text(`${dateLabel(domain[0])} – ${dateLabel(domain[1])} 2025`);
  }
  const brush = d3.brushX().extent([[left,10],[W-right,65]]).on('brush end',event=>{
    update(event.selection ? event.selection.map(x.invert) : x.domain());
    if (event.sourceEvent) select.property('value','all');
  });
  const brushGroup = overview.append('g').attr('class','brush').call(brush);
  select.on('change',function(){
    const m = this.value;
    brushGroup.call(brush.move,m==='all'?null:[x(new Date(2025,+m,1)),x(+m===11?end:new Date(2025,+m+1,1))]);
  });
  reset.on('click',()=>{select.property('value','all');brushGroup.call(brush.move,null);});
  update(x.domain());

  const ranked = [...months].sort((a,b)=>b.mean-a.mean);
  const spread = d3.greatest(months,d=>d.max-d.min);
  const diff = d3.greatest(months,d=>Math.abs(d.difference));
  const names = list => list.map(d=>monthLabel(d.date)).join(', ');
  const answer = text => d3.select('#answers').append('li').text(text);
  answer(`Seasonality (Tasks 4, 7): ${names(ranked.slice(0,2))} have the highest monthly means. ${monthLabel(ranked.at(-1).date)} is lowest. The highest mean is ${ranked[0].mean.toFixed(1)}, versus ${ranked.at(-1).mean.toFixed(1)} µg/m³: ${(ranked[0].mean/ranked.at(-1).mean).toFixed(1)} times higher.`);
  answer(`Anomalies (Task 2): ${peaks.map(d=>dateLabel(d.date)+' ('+d.city+' µg/m³)').join(' and ')}. Both are sharp spikes relative to nearby days; November also sits in the high-pollution season. Fires, dust or local emissions are possible explanations, not causes established by this practice dataset.`);
  answer(`Guideline (Task 2): ${above15}/${rows.length} (${(100*above15/rows.length).toFixed(1)}%) exceed 15; ${above75}/${rows.length} (${(100*above75/rows.length).toFixed(1)}%) exceed 75. Missing days are excluded.`);
  answer(`Build-up (Task 3): January, February, November and December increase every recorded day. ${names(months.filter(d=>d.unhealthy===0))} are flat, with zero observed days above 75.`);
  answer(`Comparison (Task 4): Both stations follow the winter-high, summer-low cycle and share the two major spikes. The largest monthly mean city-minus-suburb difference is in ${monthLabel(diff.date)} (${diff.difference.toFixed(1)} µg/m³).`);
  answer(`Composition (Task 5): Severe days occur in ${names(months.filter(d=>d.Severe>0))}. ${monthLabel(d3.greatest(months,d=>d.Low).date)} has the most Low days (${d3.max(months,d=>d.Low)}). Calendar months vary from 28 to 31 days; March additionally loses 9 sensor readings.`);
  answer('Pattern (Task 6): The strong contrast is between winter and summer months, rather than a consistent weekday stripe. This is compatible with seasonal weather and emissions, but the heatmap alone cannot identify causes.');
  answer(`Spread (Task 7): ${monthLabel(spread.date)} has the widest range: ${(spread.max-spread.min).toFixed(1)} µg/m³ (${spread.min} to ${spread.max}). Its mean of ${spread.mean.toFixed(1)} hides that extreme day.`);
  answer('Trend and quality (Task 8): The year falls toward July and rises again toward winter, suggesting a seasonal cycle. One year cannot establish a long-term trend. The 9 missing days (12–20 March) are the sensor-offline interval specified by the exercise; connecting across them would imply unobserved measurements.');
  answer('Zoom (Task 9): Select November. The 8 November value of 320 is a sharp, short-lived spike, and the daily readings around it are easier to distinguish than in the full-year view.');
  answer('Chart choice: A pie chart of monthly means cannot show the dates and duration of spikes (Task 2), or the missing March interval and day-to-day progression (Task 8). Monthly means are not parts of a meaningful whole.');
  answer(`Recommendation: February and December. Their monthly means are ${months[1].mean.toFixed(1)} and ${months[11].mean.toFixed(1)} µg/m³ (Task 7), all ${months[1].count} and ${months[11].count} recorded days exceed 75 (Task 3), and they have ${months[1].Severe} and ${months[11].Severe} Severe days (Task 5). December has the most Severe days.`);
  d3.select('#status').text('Loaded air_quality_2025.csv successfully.');
}
main().catch(error => {
  console.error(error);
  d3.select('#status').text('Could not load the data. Run this folder through a local HTTP server. ' + error.message);
});
