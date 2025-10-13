const palette = [
  '#2CAA58',
  '#b159ddff',
  '#3d1fd5ff',
  '#8C3226',
  '#678A51',
  '#47D7A1',
  '#E78140',
  '#b15a24ff',
  '#962281ff',
  '#3f9db9ff',
];
export const getAccentColor = (name: string) => {
  if (name == null) {
    return '#0f0';
  }
  let fixedColors = new Map<string, string>();
  fixedColors.set('Amerykanin', '#0379dfff');
  fixedColors.set('Austryjak', '#EF3340');
  fixedColors.set('Brytyjczyk', '#fff');
  fixedColors.set('Holender', '#FFAC1C');
  fixedColors.set('Francuz', '#318CE7');
  fixedColors.set('Niemiec', '#aa4400');
  fixedColors.set('Węgier', '#477050');

  if (fixedColors.get(name) != undefined) {
    return fixedColors.get(name);
  }

  const random = name
    .split('')
    .map((char) => char.charCodeAt(0))
    .reduce((current, previous) => Math.min(previous, 1000) + current);

  return palette[Math.floor(((random % 1000) / 1000) * palette.length)];
};
export default getAccentColor;
