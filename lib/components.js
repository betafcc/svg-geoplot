const d3 = require('d3'); require('d3-selection-multi')
const {mean: meanPoint, Geo, maybeSelect} = require('./util')

const mark = ({
  x, y,
  dx=0, dy=0,
  text,
  pathAttrs={},
  textAttrs={},
  markAttrs={},
}) => node => {
  const g = maybeSelect(node).append('g').classed('marker', true)

  // the marker itself
  g.append('path').attrs({
    d: "M0,0l-8.8-17.7C-12.1-24.3-7.4-32,0-32h0c7.4,0,12.1,7.7,8.8,14.3L0,0z",
    fill: 'none',
    stroke: '#aaa',

    ...pathAttrs
  })

  // the marker text
  g.append('text').text(text).attrs({
   'text-anchor': 'middle',
   'dominant-baseline': 'middle',
    dy: -21,
    'font-size': 10,

    ...textAttrs
  })

  return g.attrs({...markAttrs, transform: `translate(${x + dx}, ${y + dy})` + (
      (markAttrs.transform === undefined) ? '' : ' ' + markAttrs.transform
    )})
}

mark.point = ({geo, projection, point, ...args}) => {
  const _n = normalizePoint({geo, projection})(point)
  return mark({..._n, ...args})
}


mark.geo = ({lat, long, feature, geo, id, ...args}) =>
  ((lat !== undefined) && (long !== undefined)) ? mark.geo.point({lat, long, ...args}) :
  (feature !== undefined) ? mark.geo.feature({feature, ...args}) :
  ((geo !== undefined) && (id !== undefined)) ? mark.geo.featureById({geo, id, ...args}) :
  _throw(new Exception())


const _throw = e => {
  throw e
}

mark.geo.point = ({lat, long, projection, ...args}) => {
  const [x, y] = projection([long, lat])
  return mark({x, y, ...args})
}

mark.geo.feature = ({feature, projection, ...args}) => {
  const [long, lat] = meanPoint(feature.geometry.coordinates[0])
  return mark.geo.point({long, lat, projection, ...args})
}

mark.geo.featureById = ({geo, id, projection, ...args}) => {
  const feature = geo.features.find(f => f.id === id)
  return mark.geo.feature({feature, projection, ...args})
}

mark.geo.convergence = ({geo, projection, points, destiny, lineAttrs={}, ...args}) => {
  const _n = normalizePoint({geo, projection})
  const _points = points.map(_n)
  let _destiny
  if ((destiny === undefined) || (typeof destiny === 'function')) {
    const {x, y} = _points.reduce((acc, {x, y}) => ({x: acc.x + x, y: acc.y + y}))
    _destiny = {x: x / _points.length, y: y / _points.length}
    if (typeof destiny === 'function')
      _destiny = destiny(_destiny)
  }
  else
    _destiny = _n(destiny)

  return node => {
    const g = node.append('g')
    convergence({points: _points, destiny: _destiny, ...lineAttrs})(g)
    mark({..._destiny, ...args})(g)
    return g
  }
}

const normalizePoint = ({geo, projection}) => p =>
  (typeof p === 'string') ? _normalizePoint({id: p, geo, projection}) :
  _normalizePoint({geo, projection, ...p})


const _normalizePoint = ({x, y, projection, lat, long, id, geo, ...attrs}) => {
  if ((x !== undefined) && (y !== undefined)) {
    return ({x, y, ...attrs})
  }

  else if (projection !== undefined) {
    if ((lat !== undefined) && (long !== undefined)) {
      const [x, y] = projection([long, lat])
      return _normalizePoint({x, y, ...attrs})
    }

    else if ((id !== undefined) && (geo !== undefined)) {
      return _normalizePoint({projection, ...Geo.from(geo).center(id), ...attrs})
    }

    else {
      throw Exception()
    }
  }

  else {

    throw Exception()
  }
}

const geoline = ({lat1, long1, lat2, long2, projection, ...attrs}) => node => {
  const [[x1, y1], [x2, y2]] = [
    projection([long1, lat1]),
    projection([long2, lat2])
  ]

  return maybeSelect(node).append('line').attrs({
    x1, y1, x2, y2, ...attrs
  })
}

geoline.features = ({feature1, feature2, ...args}) => {
  const [[long1, lat1], [long2, lat2]] = [feature1, feature2]
        .map(e => meanPoint(e.geometry.coordinates[0]))

  return geoline({lat1, long1, lat2, long2, ...args})
}

geoline.featuresById = ({geo, id1, id2, ...args}) => {
  const [feature1, feature2] = [id1, id2].map(id => geo.features.find(f => f.id === id))
  return geoline.features({feature1, feature2, ...args})
}

const convergence = ({points, destiny: {x: xf, y: yf}, ...attrs}) => node => {
  const g = maybeSelect(node).append('g')

  points.forEach(({x, y, ...extraAttrs}) => g.append('line').attrs({
    x1: x, y1: y,
    x2: xf, y2: yf,
    ...attrs,
    ...extraAttrs
  }))

  return g
}

convergence.geo = ({projection, points, destiny, ...attrs}) => {
  const _points = points.map(({lat, long}) => {
    const [x, y] = projection([long, lat])
    return ({x, y})
  })

  const [x, y] = projection([destiny.long, destiny.lat])

  return convergence({points: _points, destiny: {x, y}, ...attrs})
}

module.exports = {
  mark,
  geoline,
  convergence
}
