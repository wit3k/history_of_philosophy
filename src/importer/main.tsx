import axios from 'axios'
import * as fs from 'fs'
import * as path from 'node:path'
import sharp from 'sharp'
import { Attitude } from '../data/dto/PersonReference'
import Coordinates from '../geometry/Coordinates'
import { parseDateAccuracy, unhackNocoYear } from '../utils/years'

const nocoUrl = (process.env.NOCO_URL ?? '').replace(/\/+$/, '')
const projectRoot = path.resolve(import.meta.dir, '../..')

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
      url: nocoUrl + '/api/v2/tables/' + tabMap[tableName].tableId + '/records',
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
      url: nocoUrl + '/api/v2/tables/' + tabMap[tableName].tableId + '/links/' + link + '/records/' + recordId,
    })
    .then(res => res.data)
    .catch(err => console.error(err))

const downloadAndProcessImage = async (
  imageUrl: string,
  outputPath: string,
  size: Coordinates,
  roundedCorners: number,
): Promise<void> => {
  if (imageUrl.includes('/undefined')) {
    return
  }
  const absoluteOutput = path.resolve(projectRoot, outputPath)
  const outputDir = path.dirname(absoluteOutput)
  fs.mkdirSync(outputDir, { recursive: true })
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
      .toFile(absoluteOutput)

    console.log(`Image saved to: ${absoluteOutput}`)
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    console.error(
      `Image failed${status ? ` (${status})` : ''}: ${absoluteOutput} (cwd ${process.cwd()}, directory exists: ${fs.existsSync(outputDir)})`,
    )
  }
}

const imageJobs: Array<() => Promise<void>> = []

const queueImage = (imageUrl: string, outputPath: string, size: Coordinates, roundedCorners: number) => {
  imageJobs.push(() => downloadAndProcessImage(imageUrl, outputPath, size, roundedCorners))
}

const runImageJobs = async (concurrency: number) => {
  let next = 0
  const worker = async () => {
    while (next < imageJobs.length) {
      const job = imageJobs[next]
      next += 1
      await job()
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, imageJobs.length) }, () => worker()))
}

const yearFromNoco = (date: string | undefined, era: string | undefined): number | undefined => {
  if (!date) return undefined
  const year = Number(date.slice(0, 4))
  if (Number.isNaN(year)) return undefined
  // Missing era → treat as N.E. (same as people/events UI default).
  const signed = year * (era === 'P.N.E.' ? -1 : 1)
  return unhackNocoYear(signed)
}

const sanitizePersonYears = (
  born: number | undefined,
  died: number | undefined,
  name: string,
): { born: number | undefined; died: number | undefined } => {
  if (born != null && died != null && born > died) {
    console.warn(`Invalid lifespan left as-is: ${name} ${born}–${died}`)
  }
  return { born, died }
}

const people = (await getTable('people')).list
  .filter((person: any) => person['Imię i nazwisko'])
  .map((person: any, i: number) => {
    if (person['Zdjęcie'] != null && person['Zdjęcie'][0] != null) {
      queueImage(
        nocoUrl + '/' + person['Zdjęcie'][0].path,
        './public/assets/person/' + person['Zdjęcie'][0].id + '.png',
        new Coordinates(30, 30),
        0,
        // new Coordinates(50, 50),
        // 5,
      )
      queueImage(
        nocoUrl + '/' + person['Zdjęcie'][0].path,
        './public/assets/person_big/' + person['Zdjęcie'][0].id + '.png',
        new Coordinates(200, 300),
        10,
      )
    }
    const years = sanitizePersonYears(
      yearFromNoco(person['Urodzony'], person['Urodzony Era']),
      yearFromNoco(person['Zmarł'], person['Zmarł Era']),
      person['Imię i nazwisko'],
    )
    return {
      born: years.born,
      bornAccuracy: parseDateAccuracy(person['Dokładność urodzenia']),
      bornLocation: person['Urodzony w'] ? person['Urodzony w'].Id : null,
      category: person['Kategoria'],
      died: years.died,
      diedAccuracy: parseDateAccuracy(person['Dokładność śmierci']),
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
          queueImage(
            nocoUrl + '/' + book['Okładka'][0].path,
            './public/assets/publication/' + book['Okładka'][0].id + '.png',
            new Coordinates(500, 700),
            10,
          )
        }
        return await getLinkedRecords('publications', 'c5yt6jo8jpe04bk', book.Id).then(authors => ({ authors, book }))
      }),
  )
).flatMap(({ book, authors }) => {
  const publicationDate = yearFromNoco(book['Rok wydania'], book['Rok wydania Era'])
  if (publicationDate == null) {
    console.warn(`Skipping publication without year: ${book['Tytuł']}`)
    return []
  }
  return authors.list.map((author: any) => ({
    authorId: author.Id + '',
    description: book['Opis'],
    id: book.Id + '',
    isbn: book['ISBN'],
    publicationDate,
    publicationLocation: book['Miejsce wydania'] !== null ? book['Miejsce wydania'].Id : -1,
    thumbnail: book['Okładka'] != null && book['Okładka'][0] != null ? book['Okładka'][0].id + '.png' : '',
    title: book['Tytuł'],
  }))
})

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
      queueImage(
        nocoUrl + '/' + location['Zdjęcie'][0].path,
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

// Nested `_nc_m2m_*` arrays from list/get are capped at 25 by NocoDB — use Links API instead.
const collectionLinkFields = {
  includedEvents: 'c2zpvv7ofdgevrk',
  includedLocations: 'cy6isfx4ugvrqxf',
  includedPeople: 'co4aoa57ymhyeel',
  includedPeopleRelations: 'cxbbw7rhf356dct',
  includedPublications: 'cd8whqtauso5nrn',
  includedReferences: 'coesuqspapto2gy',
} as const

const linkedIds = async (linkFieldId: string, recordId: number | string): Promise<number[]> => {
  const res = await getLinkedRecords('collections', linkFieldId, String(recordId))
  return (res?.list ?? []).map((row: { Id: number }) => row.Id)
}

const collections = await Promise.all(
  (await getTable('collections')).list
    .filter((collection: any) => collection['Pokaż w menu'] && collection['Osoby'] > 0)
    .map(async (collection: any) => ({
      id: collection['Id'],
      includedEvents: await linkedIds(collectionLinkFields.includedEvents, collection.Id),
      includedLocations: await linkedIds(collectionLinkFields.includedLocations, collection.Id),
      includedPeople: await linkedIds(collectionLinkFields.includedPeople, collection.Id),
      includedPeopleRelations: await linkedIds(collectionLinkFields.includedPeopleRelations, collection.Id),
      includedPublications: await linkedIds(collectionLinkFields.includedPublications, collection.Id),
      includedReferences: await linkedIds(collectionLinkFields.includedReferences, collection.Id),
      name: collection['Title'],
    })),
)

fs.writeFileSync(
  './src/data/imported/CollectionsListRaw.tsx',
  'export const CollectionsListRaw = ' + JSON.stringify(collections),
  'utf8',
)

const allHistoryEvents = (await getTable('historyEvents')).list

const historyEvents = allHistoryEvents
  .filter(
    (event: any) =>
      event['Rodzaj wydarzenia'] === 'Historia świata' &&
      event['Data od'] !== undefined &&
      event['Data do'] !== undefined,
  )
  .map((event: any) => ({
    id: event.Id,
    name: event.Tytuł,
    yearFrom: yearFromNoco(event['Data od'], event['Data od Era']),
    yearTo: yearFromNoco(event['Data do'], event['Data do Era']),
  }))

fs.writeFileSync(
  './src/data/imported/HistoryEventsListRaw.tsx',
  'export const HistoryEventsListRaw = ' + JSON.stringify(historyEvents),
  'utf8',
)

const peopleHistoryEvents = allHistoryEvents
  .filter((event: any) => event['Rodzaj wydarzenia'] !== 'Historia świata' && event['Osoby']?.length)
  .map((event: any) => ({
    id: event.Id,
    locationId: event['Miejsca']?.[0]?.Id ?? null,
    name: event.Tytuł,
    personId: event['Osoby'][0].Id + '',
    type: event['Rodzaj wydarzenia'],
    yearFrom: yearFromNoco(event['Data od'], event['Data od Era']) ?? null,
    yearTo: yearFromNoco(event['Data do'], event['Data do Era']) ?? null,
  }))

fs.writeFileSync(
  './src/data/imported/PeopleHistoryEventsListRaw.tsx',
  'export const PeopleHistoryEventsListRaw = ' + JSON.stringify(peopleHistoryEvents),
  'utf8',
)

await runImageJobs(4)
