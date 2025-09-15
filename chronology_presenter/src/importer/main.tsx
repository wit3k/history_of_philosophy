import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';
import { Attitude } from '../data/dto/PersonReference';

let tabMap: any = {
  people: { tableId: 'mx6pwcyvc2oab8l', viewId: 'vw5tn6tu17x018ii' },
  peopleReference: { tableId: 'mixl3m1i8i3e2nt', viewId: 'vw08gj6s4gss1rnk' },
  publications: { tableId: 'me77551rlyondy9', viewId: 'vwrik2hmo15eufg6' },
};

let getTable = async (tableName: string) =>
  await axios
    .request({
      method: 'GET',
      url:
        process.env.NOCO_URL +
        '/api/v2/tables/' +
        tabMap[tableName].tableId +
        '/records',
      params: {
        offset: '0',
        limit: '1000',
        where: '',
        viewId: tabMap[tableName].viewId,
      },
      headers: {
        'xc-token': process.env.NOCO_TOKEN,
      },
    })
    .then((res) => res.data)
    .catch((err) => console.error(err));

let getLinkedRecords = async (
  tableName: string,
  link: string,
  recordId: string,
) =>
  await axios
    .request({
      method: 'GET',
      url:
        process.env.NOCO_URL +
        '/api/v2/tables/' +
        tabMap[tableName].tableId +
        '/links/' +
        link +
        '/records/' +
        recordId,
      params: {
        offset: '0',
        limit: '1000',
        where: '',
        viewId: tabMap[tableName].viewId,
      },
      headers: {
        'xc-token': process.env.NOCO_TOKEN,
      },
    })
    .then((res) => res.data)
    .catch((err) => console.error(err));

let downloadAndProcessImage = async (
  imageUrl: string,
  outputPath: string,
): Promise<void> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data);
    const roundedCornerMask = Buffer.from(
      `<svg width="50" height="50">
        <rect x="0" y="0" width="50" height="50" rx="5" ry="5" fill="white"/>
      </svg>`,
    );

    await sharp(imageBuffer)
      .resize(50, 50, {
        fit: 'cover',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .composite([
        {
          input: roundedCornerMask,
          blend: 'dest-in',
        },
      ])
      .ensureAlpha()
      .png()
      .toFile(outputPath);

    console.log(`Image saved to: ${outputPath}`);
  } catch (error) {
    throw error;
  }
};

let people = (await getTable('people')).list
  .filter((person: any) => person['Imię i nazwisko'])
  .map((person: any, i: number) => {
    if (person['Zdjęcie'] != null && person['Zdjęcie'][0] != null) {
      downloadAndProcessImage(
        process.env.NOCO_URL + '/' + person['Zdjęcie'][0].path,
        './public/assets/person/' + person['Zdjęcie'][0].id + '.png',
      );
    }

    return {
      id: person.Id + '',
      name: person['Imię i nazwisko'],
      born: person['Urodzony'] ? person['Urodzony']?.slice(0, 4) * 1 : null,
      died: person['Zmarł']
        ? person['Zmarł']?.slice(0, 4)
        : person['Urodzony']?.slice(0, 4) * 1 + 100,
      rowNumber: person['Wiersz'] ? person['Wiersz'] * 1 : i + 1,
      thumbnail:
        person['Zdjęcie'] != null && person['Zdjęcie'][0] != null
          ? person['Zdjęcie'][0].id + '.png'
          : null,
    };
  });

fs.writeFileSync(
  './src/data/imported/PeopleListRaw.tsx',
  'export const PeopleListRaw = ' + JSON.stringify(people),
  'utf8',
);

let peopleReference = (
  await Promise.all(
    (
      await getTable('peopleReference')
    ).list
      .filter((pr: any) => pr['Słowny opis'])
      .map(
        async (sideA: any, i: number) =>
          await getLinkedRecords(
            'peopleReference',
            'cr4ogkxshzfg2cr',
            sideA.Id,
          ).then((sideB) => ({ sideA, sideB })),
      ),
  )
).flatMap(({ sideA, sideB }) =>
  sideB.list.map((sB: any) => ({
    id: sideA.Id + '',
    name: sideA['Słowny opis'],
    attitude:
      sideA['Ogólny stosunek'] == 'Pozytywny'
        ? Attitude[Attitude.Positive]
        : sideA['Ogólny stosunek'] == 'Negatywny'
          ? Attitude[Attitude.Negative]
          : Attitude[Attitude.Neutral],
    from: sideA['Osoba A'].Id + '',
    to: sB.Id + '',
  })),
);

fs.writeFileSync(
  './src/data/imported/PersonReferenceListRaw.tsx',
  'export const PersonReferenceListRaw = ' + JSON.stringify(peopleReference),
  'utf8',
);

let publications = (
  await Promise.all(
    (
      await getTable('publications')
    ).list
      .filter((pr: any) => pr['Autorzy'] && pr['Tytuł'])
      .map(
        async (book: any, i: number) =>
          await getLinkedRecords(
            'publications',
            'c5yt6jo8jpe04bk',
            book.Id,
          ).then((authors) => ({ book, authors })),
      ),
  )
).flatMap(({ book, authors }) =>
  authors.list.map((author: any) => ({
    id: book.Id + '',
    title: book['Tytuł'],
    publicationDate: book['Rok wydania'].slice(0, 4) * 1,
    authorId: author.Id + '',
  })),
);

fs.writeFileSync(
  './src/data/imported/PublicationsListRaw.tsx',
  'export const PublicationsListRaw = ' + JSON.stringify(publications),
  'utf8',
);

console.log(publications);
