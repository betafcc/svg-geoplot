const fs = require('fs')
const PDFDocument = require('pdfkit')
const svg = require('@betafcc/svg')
const doc = new PDFDocument();


const geoplot = require('./lib')

// Essa url contém um topojson do mapa do Brasil por uf
const url = 'https://raw.githubusercontent.com/betafcc/mapas-kronoos/master/ufs.topo.json'


const main = async () => {
  doc.pipe(fs.createWriteStream('output.pdf'))

  svg
    .apply(
      (await geoplot.fetch({
        url, // a url do topojson
        key: 'ufs' // o campo 'id' das features no topojson
      }))
      // pode ser usado com o mapa em arquivo local
      // (geoplot({topo: require('./ufs.topo.json'), key: 'ufs'}))
        .mark({point: 'PI', text: 1, dy: 2})
        .mark({point: 'MT', text: 2})
        .mark({point: 'DF', text: 3})
        .mark({point: 'ES', text: 4})
        .mark({point: {lat: -23.44, long: -46.67}, text: 6})
        .mark({point: {lat: -21.48, long: -48.63}, text: 5})
        .mark({
          points: ['MS', 'PR', 'SC'],
          destiny: c => ({x: c.x - 15, y: c.y + 5}),
          text: 7
        })
        .mark({
          points: ['CE', 'RN', 'PB', 'PE', 'AL'],
          destiny: c => ({x: c.x - 5, y: c.y - 15}),
          text: 8,
        })
    )
    .toPdfkit(doc, {x: 200, y: 100, width: 350, height: 350})

  doc.end()
}


main()
