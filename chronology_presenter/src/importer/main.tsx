import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';
import { Attitude } from '../data/dto/PersonReference';
import Coordinates from '../geometry/Coordinates';

let tabMap: any = {
  people: { tableId: 'mx6pwcyvc2oab8l', viewId: 'vw5tn6tu17x018ii' },
  peopleReference: { tableId: 'mixl3m1i8i3e2nt', viewId: 'vw08gj6s4gss1rnk' },
  publications: { tableId: 'me77551rlyondy9', viewId: 'vwrik2hmo15eufg6' },
  quotes: { tableId: 'mljf7f47zgv9mgv', viewId: 'vwpdfjd6bln6nmu9' },
  locations: { tableId: 'my7pr4s2kwgoesx', viewId: 'vw1sg7plf8bnr46l' },
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
  size: Coordinates,
): Promise<void> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data);
    const roundedCornerMask = Buffer.from(
      '<svg width="' +
        size.x +
        '" height="' +
        size.y +
        '"><rect x="0" y="0" width="' +
        size.x +
        '" height="' +
        size.y +
        '" rx="10" ry="10" fill="white"/></svg>',
    );

    await sharp(imageBuffer)
      .resize(size.x, size.y, {
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
        new Coordinates(50, 50),
      );
      downloadAndProcessImage(
        process.env.NOCO_URL + '/' + person['Zdjęcie'][0].path,
        './public/assets/person_big/' + person['Zdjęcie'][0].id + '.png',
        new Coordinates(200, 300),
      );
    }

    return {
      id: person.Id + '',
      name: person['Imię i nazwisko'],
      born: person['Urodzony'] ? person['Urodzony']?.slice(0, 4) * 1 : null,
      died: person['Zmarł'] ? person['Zmarł']?.slice(0, 4) * 1 : undefined,
      bornLocation: person['Urodzony w'].Id,
      diedLocation: person['Zmarł w'].Id,
      nationality: person['Narodowości'].split(',')[0],
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
            'c5chrrav0rvti4l',
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
      .map(async (book: any, i: number) => {
        if (book['Okładka'] != null && book['Okładka'][0] != null) {
          downloadAndProcessImage(
            process.env.NOCO_URL + '/' + book['Okładka'][0].path,
            './public/assets/publication/' + book['Okładka'][0].id + '.png',
            new Coordinates(500, 700),
          );
        }
        return await getLinkedRecords(
          'publications',
          'c5yt6jo8jpe04bk',
          book.Id,
        ).then((authors) => ({ book, authors }));
      }),
  )
).flatMap(({ book, authors }) =>
  authors.list.map((author: any) => ({
    id: book.Id + '',
    title: book['Tytuł'],
    publicationDate: book['Rok wydania'].slice(0, 4) * 1,
    publicationLocation:
      book['Miejsce wydania'] != undefined ? book['Miejsce wydania'].Id : '',
    authorId: author.Id + '',
    isbn: book['ISBN'],
    description: book['Opis'],
    thumbnail:
      book['Okładka'] != undefined ? book['Okładka'][0].id + '.png' : '',
  })),
);

fs.writeFileSync(
  './src/data/imported/PublicationsListRaw.tsx',
  'export const PublicationsListRaw = ' + JSON.stringify(publications),
  'utf8',
);

let quotes = (await getTable('quotes')).list
  .filter(
    (quote: any) => quote['Nagłówek'] && quote['Nawiązanie do publikacji'],
  )
  .map((quote: any, i: number) => ({
    id: quote.Id,
    name: quote['Nagłówek'],
    from: quote['Publikacja'].Id,
    to: quote['Nawiązanie do publikacji'].Id,
  }));

fs.writeFileSync(
  './src/data/imported/PublicationReferenceListRaw.tsx',
  'export const PublicationReferenceListRaw = ' + JSON.stringify(quotes),
  'utf8',
);

let locations = (await getTable('locations')).list
  .filter((location: any) => location['Nazwa'] && location['Koordynaty'])
  .map((location: any, i: number) => {
    if (location['Zdjęcie'] != null) {
      downloadAndProcessImage(
        process.env.NOCO_URL + '/' + location['Zdjęcie'][0].path,
        './public/assets/location/' + location['Zdjęcie'][0].id + '.png',
        new Coordinates(480, 200),
      );
    }
    return {
      id: location.Id,
      name: location['Nazwa'],
      coordinates: location['Koordynaty'],
      thumbnail:
        location['Zdjęcie'] != undefined
          ? location['Zdjęcie'][0].id + '.png'
          : '',
    };
  });

fs.writeFileSync(
  './src/data/imported/LocationListRaw.tsx',
  'export const LocationListRaw = ' + JSON.stringify(locations),
  'utf8',
);
