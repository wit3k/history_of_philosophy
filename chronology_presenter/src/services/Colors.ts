const palette = [
  '#2CAA58',
  '#381A47',
  '#321E94',
  '#8C3226',
  '#678A51',
  '#47D7A1',
  '#E78140',
  '#321706',
  '#1B5383',
  '#2F0427',
  '#55BAD8',
];
export const getAccentColor = (name: string) => {
  const random = name
    .split('')
    .map((char) => char.charCodeAt(0))
    .reduce((current, previous) => Math.min(previous, 1000) + current);

  return palette[Math.floor(((random % 1000) / 1000) * palette.length)];
};
export default getAccentColor;
