const d3 = require('d3'); require('d3-selection-multi')
const topojson = require('topojson')

const {maybeSelect} = require('./util')
const {mark} = require('./components.js')


const geoplot = ({topo, key, features={}, borders={}, marks=[]}) => {
  const _args = {topo, key, features, borders, marks}
  const geo = topojson.feature(topo, topo.objects[key])
  const borderMesh = topojson.mesh(topo, topo.objects[key])
  const projection = d3.geoMercator().fitSize([100, 100], geo)
  const d = d3.geoPath().projection(projection)

  const api = node => {
    const g = maybeSelect(node).append('g')

    g.append('g').selectAll('.feature').data(geo.features).enter().append('path').attrs({
      d, fill: '#eaeaea', ...features
    })

    g.append('g').append('path').datum(borderMesh).attrs({
      d,
      stroke: '#fff',
      'stroke-width': 0.2,
      fill: 'none',
      'stroke-linejoin': 'round',
      ...borders
    })

    const markGroup = g.append('g')
    marks.map(addMark({geo, projection})).forEach(m => m(g))
  }

  api.features = features => geoplot({..._args, features})
  api.borders = borders => geoplot({..._args, borders})
  api.mark = o =>
    geoplot({..._args, marks: [...marks, o]})

  return api
}

geoplot.fetch = ({url, ...args}) =>
  require('node-fetch')(url)
  .then(r => r.json())
  .then(r => geoplot({topo: r, ...args}))

const addMark = ({geo, projection}) => ({points, destiny, point, ...args}) =>
  (points !== undefined)
    ? addConvergenceMark({geo, projection, points, destiny, ...args})
    : addPointMark({geo, projection, point, ...args})


const addConvergenceMark = ({geo, projection, points, destiny, text, ...args}) =>
  mark.geo.convergence(defaultMarkArgs({
      geo, projection, points, destiny, text, dy: -1, ...args
  }))


const addPointMark = ({geo, projection, point, text, ...args}) =>
  mark.point(defaultMarkArgs({geo, projection, point, text, ...args}))


const defaultMarkArgs = ({geo, projection, text, ...args}) => ({
  geo, projection, text,
  ...args,
  pathAttrs: {
    stroke: '#aaa', 'stroke-width': 1, fill: 'white',
    ...(args.pathAttrs || {}),
  },
  lineAttrs: {
    stroke: '#aaa', 'stroke-width': 0.2,
    ...(args.lineAttrs || {}),
  },
  markAttrs: {
    transform: 'scale(0.3)',
    ...(args.markAttrs || {}),
  }
})


module.exports = geoplot
