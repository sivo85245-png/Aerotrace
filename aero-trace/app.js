const el = id => document.getElementById(id);
const colors = ['#007888', '#b64e09', '#7354aa'];
const descriptions = {
  drift: 'A partir de 60 s, B acumula um viés de 0,48 kt/s até 28 kt. Compare o início da deriva com o instante de confirmação.',
  spike: 'Em 83 s, B recebe um pico de 27 kt por uma amostra. Experimente reduzir a persistência para 1.',
  clean: 'Os três canais têm apenas ruído independente e limitado. Use este caso como controle.',
  common: 'A partir de 60 s, todos os canais recebem o mesmo viés de 18 kt. A comparação com a mediana perde essa falha porque os três continuam concordando.'
};
let result, timer;
for (const [value, name] of Object.entries(Aero.cases)) el('scenario').add(new Option(name, value));
function stop() {
  clearInterval(timer);
  timer = null;
  el('play').textContent = 'Reproduzir';
}
const x = t => 46 + t * 700 / 180;
const y = v => 235 - (v - 160) * 2.8;
function draw() {
  let grid = '';
  for (let v = 160; v <= 240; v += 20) {
    grid += '<path d="M46 '+y(v)+'h700" stroke="#dbe6df"/><text x="7" y="'+(y(v)+4)+'">'+v+'</text>';
  }
  for (let t = 0; t <= 180; t += 30)
    grid += '<text text-anchor="middle" x="'+x(t)+'" y="259">'+t+' s</text>';
  const paths = colors.map((color, i) => {
    const points = result.rows.map(r => x(r.t).toFixed(2)+','+y(r.values[i]).toFixed(2)).join(' ');
    return '<polyline fill="none" stroke="'+color+'" stroke-width="2" points="'+points+'"/>';
  });
  el('plot').innerHTML = '<g font-family="monospace" font-size="12" fill="#526d63">'+grid+'</g>'+paths.join('')+'<line id="marker" y1="10" y2="236" stroke="#172c2a" stroke-dasharray="4 4"/>';
}
function inspect() {
  const r = result.rows[Number(el('cursor').value)];
  el('time').textContent = r.t+' s';
  el('marker').setAttribute('x1', x(r.t));
  el('marker').setAttribute('x2', x(r.t));
  el('readings').innerHTML = r.values.map((v, i) =>
    '<div class="reading"><span>Canal '+Aero.channels[i]+'</span><strong>'+v.toFixed(1)+' kt</strong><em>Desvio '+r.residuals[i].toFixed(1)+' kt'+(r.alarms[i]?' · <b class="alarm">Alerta ativo</b>':'')+'</em></div>').join('');
  el('median').textContent = 'Mediana dos canais · '+r.median.toFixed(1)+' kt';
}
function analyze() {
  stop();
  for (const id of ['threshold', 'persistence']) {
    const input = el(id);
    if (!input.value || !input.checkValidity()) {
      input.reportValidity();
      input.value = input.dataset.last || input.defaultValue;
    }
    input.dataset.last = input.value;
  }
  const scenario = el('scenario').value;
  result = Aero.analyze(Aero.simulate(scenario), Number(el('threshold').value), Number(el('persistence').value));
  el('truth').textContent = descriptions[scenario];
  const box = el('events');
  box.replaceChildren();
  if (!result.events.length) box.textContent = 'Nenhum desvio atingiu o critério de confirmação.';
  for (const e of result.events) {
    const b = document.createElement('button');
    b.textContent = e.t+' s · Canal '+e.channel+' · Ver confirmação';
    b.onclick = () => { stop(); el('cursor').value = e.t; inspect(); };
    box.append(b);
  }
  draw(); inspect();
}
for (const id of ['scenario', 'threshold', 'persistence']) el(id).onchange = analyze;
el('cursor').oninput = () => { stop(); inspect(); };
el('play').onclick = () => {
  if (timer) return stop();
  if (+el('cursor').value === 180) el('cursor').value = 0;
  el('play').textContent = 'Pausar';
  timer = setInterval(() => {
    el('cursor').value = Number(el('cursor').value) + 1;
    inspect();
    if (+el('cursor').value === 180) stop();
  }, 100);
};
el('export').onclick = () => {
  const lines = ['t_s,A_kt,B_kt,C_kt,mediana_kt,alarme_A,alarme_B,alarme_C'];
  for (const r of result.rows) lines.push([r.t, ...[...r.values,r.median].map(v=>v.toFixed(3)), ...r.alarms.map(Number)].join(','));
  const url = URL.createObjectURL(new Blob([lines.join('\n')], {type:'text/csv'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = ['aerotrace',el('scenario').value,el('threshold').value+'kt',el('persistence').value+'amostras'].join('-')+'.csv';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
analyze();
