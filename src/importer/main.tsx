import axios from 'axios'
import * as fs from 'fs'
import sharp from 'sharp'
import { Attitude } from '../data/dto/PersonReference'
import Coordinates from '../geometry/Coordinates'

const tabMap: any = {
  collections: { tableId: 'mqubv6pjfhgobsd', viewId: 'vwiqdleig055xc5b' },
  historyEvents: { tableId: 'm78tbyteswhe0sq', viewId: 'vwqfiq3o3f3kgeuk' },
  locations: { tableId: 'my7pr4s2kwgoesx', viewId: 'vw1sg7plf8bnr46l' },
  people: { tableId: 'mx6pwcyvc2oab8l', viewId: 'vw5tn6tu17x018ii' },
  peopleReference: { tableId: 'mixl3m1i8i3e2nt', viewId: 'vw08gj6s4gss1rnk' },
  publications: { tableId: 'me77551rlyondy9', viewId: 'vwrik2hmo15eufg6' },
  quotes: { tableId: 'mljf7f47zgv9mgv', viewId: 'vwpdfjd6bln6nmu9' },
}
const getTable = async (tableName: string) =>
  await axios
    .request({
      headers: {
        'xc-token': process.env.NOCO_TOKEN,
      },
      method: 'GET',
      params: {
        limit: '1000',
        offset: '0',
        viewId: tabMap[tableName].viewId,
        where: '',
      },
      url: process.env.NOCO_URL + '/api/v2/tables/' + tabMap[tableName].tableId + '/records',
    })
    .then(res => res.data)
    .catch(err => console.error(err))

const getLinkedRecords = async (tableName: string, link: string, recordId: string) =>
  await axios
    .request({
      headers: {
        'xc-token': process.env.NOCO_TOKEN,
      },
      method: 'GET',
      params: {
        limit: '1000',
        offset: '0',
        viewId: tabMap[tableName].viewId,
        where: '',
      },
      url:
        process.env.NOCO_URL +
        '/api/v2/tables/' +
        tabMap[tableName].tableId +
        '/links/' +
        link +
        '/records/' +
        recordId,
    })
    .then(res => res.data)
    .catch(err => console.error(err))

const downloadAndProcessImage = async (
  imageUrl: string,
  outputPath: string,
  size: Coordinates,
  roundedCorners: number,
): Promise<void> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    })
    const imageBuffer = Buffer.from(response.data)
    const roundedCornerMask = Buffer.from(
      '<svg width="' +
        size.x +
        '" height="' +
        size.y +
        '"><rect x="0" y="0" width="' +
        size.x +
        '" height="' +
        size.y +
        '" rx="' +
        roundedCorners +
        '" ry="' +
        roundedCorners +
        '" fill="white"/></svg>',
    )

    await sharp(imageBuffer)
      .resize(size.x, size.y, {
        background: { alpha: 0, b: 0, g: 0, r: 0 },
        fit: 'cover',
      })
      .composite([
        {
          blend: 'dest-in',
          input: roundedCornerMask,
        },
      ])
      .ensureAlpha()
      .png()
      .toFile(outputPath)

    console.log(`Image saved to: ${outputPath}`)
  } catch (error) {
    throw error
  }
}

const people = (await getTable('people')).list
  .filter((person: any) => person['Imię i nazwisko'])
  .map((person: any, i: number) => {
    if (person['Zdjęcie'] != null && person['Zdjęcie'][0] != null) {
      downloadAndProcessImage(
        process.env.NOCO_URL + '/' + person['Zdjęcie'][0].path,
        './public/assets/person/' + person['Zdjęcie'][0].id + '.png',
        new Coordinates(50, 50),
        5,
      )
      downloadAndProcessImage(
        process.env.NOCO_URL + '/' + person['Zdjęcie'][0].path,
        './public/assets/person_big/' + person['Zdjęcie'][0].id + '.png',
        new Coordinates(200, 300),
        10,
      )
    }
    return {
      born: person['Urodzony']
        ? (person['Urodzony']?.slice(0, 1) === '3'
            ? person['Urodzony']?.slice(2, 4)
            : person['Urodzony']?.slice(0, 4)) * (person['Urodzony Era'] === 'N.E.' ? 1 : -1)
        : undefined,
      bornLocation: person['Urodzony w'] ? person['Urodzony w'].Id : null,
      category: person['Kategoria'],
      died: person['Zmarł']
        ? (person['Zmarł']?.slice(0, 1) === '3' ? person['Zmarł']?.slice(2, 4) : person['Zmarł']?.slice(0, 4)) *
          (person['Zmarł Era'] === 'N.E.' ? 1 : -1)
        : undefined,
      diedLocation: person['Zmarł w'] ? person['Zmarł w'].Id : null,
      id: person.Id + '',
      name: person['Imię i nazwisko'],
      nationality: person['Narodowości'] ? person['Narodowości'].split(',')[0] : null,
      stillAlive: person['Nadal żyje'],
      // rowNumber: person['Wiersz'] ? person['Wiersz'] * 1 : i + 1,
      thumbnail: person['Zdjęcie'] != null && person['Zdjęcie'][0] != null ? person['Zdjęcie'][0].id + '.png' : null,
    }
  })

fs.writeFileSync(
  './src/data/imported/PeopleListRaw.tsx',
  'export const PeopleListRaw = ' + JSON.stringify(people),
  'utf8',
)

const peopleReference = (
  await Promise.all(
    (
      await getTable('peopleReference')
    ).list
      .filter((pr: any) => pr['Słowny opis'])
      .map(
        async (sideA: any, i: number) =>
          await getLinkedRecords('peopleReference', 'c5chrrav0rvti4l', sideA.Id).then(sideB => ({ sideA, sideB })),
      ),
  )
).flatMap(({ sideA, sideB }) =>
  sideB.list.map((sB: any) => ({
    attitude:
      sideA['Ogólny stosunek'] === 'Pozytywny'
        ? Attitude[Attitude.Positive]
        : sideA['Ogólny stosunek'] === 'Negatywny'
          ? Attitude[Attitude.Negative]
          : Attitude[Attitude.Neutral],
    from: sideA['Osoba A'].Id + '',
    id: sideA.Id + '',
    name: sideA['Słowny opis'],
    to: sB.Id + '',
  })),
)

fs.writeFileSync(
  './src/data/imported/PersonReferenceListRaw.tsx',
  'export const PersonReferenceListRaw = ' + JSON.stringify(peopleReference),
  'utf8',
)

const publications = (
  await Promise.all(
    (
      await getTable('publications')
    ).list
      .filter((pr: any) => pr.Autorzy && pr.Tytuł)
      .map(async (book: any, i: number) => {
        if (book.Okładka != null && book.Okładka[0] != null) {
          downloadAndProcessImage(
            process.env.NOCO_URL + '/' + book['Okładka'][0].path,
            './public/assets/publication/' + book['Okładka'][0].id + '.png',
            new Coordinates(500, 700),
            10,
          )
        }
        return await getLinkedRecords('publications', 'c5yt6jo8jpe04bk', book.Id).then(authors => ({ authors, book }))
      }),
  )
).flatMap(({ book, authors }) =>
  authors.list.map((author: any) => ({
    authorId: author.Id + '',
    description: book['Opis'],
    id: book.Id + '',
    isbn: book['ISBN'],
    publicationDate: book['Rok wydania'].slice(0, 4) * 1,
    publicationLocation: book['Miejsce wydania'] !== null ? book['Miejsce wydania'].Id : -1,
    thumbnail: book['Okładka'] !== undefined ? book['Okładka'][0].id + '.png' : '',
    title: book['Tytuł'],
  })),
)

fs.writeFileSync(
  './src/data/imported/PublicationsListRaw.tsx',
  'export const PublicationsListRaw = ' + JSON.stringify(publications),
  'utf8',
)

const quotes = (await getTable('quotes')).list
  .filter((quote: any) => quote['Nagłówek'] && quote['Nawiązanie do publikacji'])
  .map((quote: any, _: number) => ({
    from: quote['Publikacja'].Id,
    id: quote.Id,
    name: quote['Nagłówek'],
    to: quote['Nawiązanie do publikacji'].Id,
  }))

fs.writeFileSync(
  './src/data/imported/PublicationReferenceListRaw.tsx',
  'export const PublicationReferenceListRaw = ' + JSON.stringify(quotes),
  'utf8',
)

const locations = (await getTable('locations')).list
  .filter((location: any) => location['Nazwa'] && location['Koordynaty'])
  .map((location: any, i: number) => {
    if (location['Zdjęcie'] != null) {
      downloadAndProcessImage(
        process.env.NOCO_URL + '/' + location['Zdjęcie'][0].path,
        './public/assets/location/' + location['Zdjęcie'][0].id + '.png',
        new Coordinates(480, 200),
        10,
      )
    }
    return {
      coordinates: location['Koordynaty'],
      id: location.Id,
      name: location['Nazwa'],
      thumbnail: location['Zdjęcie'] != undefined ? location['Zdjęcie'][0].id + '.png' : '',
    }
  })

fs.writeFileSync(
  './src/data/imported/LocationListRaw.tsx',
  'export const LocationListRaw = ' + JSON.stringify(locations),
  'utf8',
)

const collections = (await getTable('collections')).list
  .filter((collection: any) => collection['Pokaż w menu'] && collection['_nc_m2m_Kolekcje_Osobies'].length > 0)
  .map((collection: any, i: number) => {
    return {
      id: collection['Id'],
      includedEvents: collection['_nc_m2m_Kolekcje_Wydarzenia'].map((o: any) => o['Wydarzenia_id']),
      includedLocations: collection['_nc_m2m_Kolekcje_Lokacjes'].map((o: any) => o['Lokacje_id']),
      includedPeople: collection['_nc_m2m_Kolekcje_Osobies'].map((o: any) => o['Osoby_id']),
      includedPeopleRelations: collection['_nc_m2m_Kolekcje_Relacje międzyls'].map(
        (o: any) => o['Relacje międzyludzkie_id'],
      ),
      includedPublications: collection['_nc_m2m_Kolekcje_Publikacjes'].map((o: any) => o['Publikacje_id']),
      includedReferences: collection['_nc_m2m_Kolekcje_Odniesienia'].map((o: any) => o['Odniesienia_id']),
      name: collection['Title'],
    }
  })

fs.writeFileSync(
  './src/data/imported/CollectionsListRaw.tsx',
  'export const CollectionsListRaw = ' + JSON.stringify(collections),
  'utf8',
)

const historyEvents = (await getTable('historyEvents')).list
  .filter(
    (event: any) =>
      event['Rodzaj wydarzenia'] === 'Historia świata' &&
      event['Data od'] !== undefined &&
      event['Data do'] !== undefined,
  )
  .map((event: any, i: number) => ({
    id: event.Id,
    name: event.Tytuł,
    yearFrom: event['Data od']
      ? (event['Data od']?.slice(0, 1) === '3' ? event['Data od']?.slice(2, 4) : event['Data od']?.slice(0, 4)) *
        (event['Data od Era'] === 'N.E.' ? 1 : -1)
      : undefined,
    yearTo: event['Data do']
      ? (event['Data do']?.slice(0, 1) === '3' ? event['Data do']?.slice(2, 4) : event['Data do']?.slice(0, 4)) *
        (event['Data do Era'] === 'N.E.' ? 1 : -1)
      : undefined,
  }))

fs.writeFileSync(
  './src/data/imported/HistoryEventsListRaw.tsx',
  'export const HistoryEventsListRaw = ' + JSON.stringify(historyEvents),
  'utf8',
)
