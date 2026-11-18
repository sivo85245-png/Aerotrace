// Pure analysis functions shared by the browser and the Node test runner.
const Aero = (() => {
  const channels = ['A', 'B', 'C'];
  const cases = {
    drift: 'Deriva progressiva', spike: 'Pico transitório', clean: 'Voo nominal',
    common: 'Falha de modo comum'
  };
  function simulate(scenario, seed = 931) {
    if (!(scenario in cases)) throw new Error('Cenário desconhecido');
    let state = seed >>> 0;
    function noise() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state / 4294967296 - 0.5) * 1.8;
    }
    return Array.from({length: 181}, (_, t) => {
      const nominal = 185 + 9 * Math.sin(t / 45) + 2 * Math.cos(t / 14);
      const common = scenario === 'common' && t >= 60 ? 18 : 0;
      const values = channels.map(() => nominal + common + noise());
      if (scenario === 'drift' && t >= 60) values[1] += Math.min(28, (t - 60) * 0.48);
      if (scenario === 'spike' && t === 83) values[1] += 27;
      return {t, values};
    });
  }

  // No access to the injected scenario or the noiseless nominal signal.
  function analyze(samples, threshold, persistence) {
    if (!(Number.isFinite(threshold) && threshold > 0 && Number.isInteger(persistence) && persistence >= 1))
      throw new Error('Parâmetros inválidos');
    const streak = [0, 0, 0], events = [];
    const rows = samples.map(({t, values}) => {
      const median = [...values].sort((a, b) => a - b)[1];
      const residuals = values.map(v => Math.abs(v - median));
      residuals.forEach((r, i) => {
        streak[i] = r > threshold ? streak[i] + 1 : 0;
        if (streak[i] === persistence) events.push({channel: channels[i], t, start: t - persistence + 1});
      });
      return {t, values, median, residuals, alarms: streak.map(n => n >= persistence)};
    });
    return {rows, events};
  }
  return {channels, cases, simulate, analyze};
})();
if (typeof module !== 'undefined') module.exports = Aero;
