const NOT_COUNTRIES = new Set(['EU', 'EZ', 'UN', 'UK']);

export const COUNTRIES: { code: string; name: string }[] = (() => {
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const options: { code: string; name: string }[] = [];
  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code = String.fromCharCode(first) + String.fromCharCode(second);
      if (NOT_COUNTRIES.has(code)) continue;
      const name = names.of(code);
      if (name && name !== code) options.push({ code, name });
    }
  }
  options.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  return options;
})();
