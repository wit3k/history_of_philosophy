const palette = [
  '#2CAA58',
  '#b159ddff',
  '#3d1fd5ff',
  '#8C3226',
  '#678A51',
  '#47D7A1',
  '#E78140',
  '#b15a24ff',
  '#0379dfff',
  '#962281ff',
  '#3f9db9ff',
];
export const getAccentColor = (name: string) => {
  const random = name
    .split('')
    .map((char) => char.charCodeAt(0))
    .reduce((current, previous) => Math.min(previous, 1000) + current);

  return palette[Math.floor(((random % 1000) / 1000) * palette.length)];
};
export default getAccentColor;
