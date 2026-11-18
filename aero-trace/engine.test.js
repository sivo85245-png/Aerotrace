const test = require('node:test');
const assert = require('node:assert/strict');
const {simulate, analyze} = require('./engine');
const run = (scenario, persistence = 3) => analyze(simulate(scenario), 8, persistence).events;
test('Caso nominal sem alertas', () => assert.deepEqual(run('clean'), []));
test('Deriva confirmada apenas em B', () => {
  const events = run('drift');
  assert.equal(events.length, 1);
  assert.equal(events[0].channel, 'B');
  assert.ok(events[0].t >= 76 && events[0].t <= 84);
});
test('Persistência rejeita pico de uma amostra', () => assert.deepEqual(run('spike'), []));
test('Com persistência 1 o pico é registrado', () => assert.deepEqual(run('spike', 1), [{channel:'B',start:83,t:83}]));
test('Viés comum é invisível para comparação relativa', () => assert.deepEqual(run('common'), []));
test('Semente fixa reproduz o mesmo voo', () => assert.deepEqual(simulate('clean'), simulate('clean')));
test('Igualdade ao limiar interrompe sequência e permite novo evento', () => {
  const samples = [9,9,8,10,10].map((v,t)=>({t,values:[0,v,0]}));
  assert.deepEqual(analyze(samples,8,2).events.map(e=>e.t), [1,4]);
});
test('Rejeita persistência fracionária', () => assert.throws(()=>analyze([],8,1.5)));
