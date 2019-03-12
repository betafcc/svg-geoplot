const fetch = require('node-fetch')
const {transpose, sum} = require('d3-array')
const d3 = require('d3')


const mean = points =>
  transpose(points)
  .map(p => sum(p) / points.length)


class Geo {
  constructor(geojson) {
    this.geojson = geojson
  }

  static from(json) {
    // TODO: detect format
    return Geo.fromGeoJSON(json)
  }

  static fromGeoJSON(json) {
    return new Geo(json)
  }

  static fromTopoJSON(json, key) {
    return new Geo(require('topojson').feature(json, json.object[key]))
  }

  feature(id) {
    return this.geojson.features.find(f => f.id === id)
  }

  filter(p) {
    return Geo.from({...this.geojson, features: this.features.filter(p)})
  }

  center(id) {
    const [long, lat] = mean(this.feature(id).geometry.coordinates[0])
    return {long, lat}
  }

  centers(...ids) {
    return ids.map(id => this.center(id))
  }

  manyCenter(...ids) {
    const points = this.centers(...ids).map(({long, lat}) => [long, lat])
    const [long, lat] = mean(points)
    return {long, lat}
  }
}


const queryParams = (url, {...params}={}) => {
  const _url = new URL(url)
  Object.entries(params).forEach(([k, v]) => _url.searchParams.append(k, v))
  return _url.toString()
}


const ibgeMalhas = ({
    id='BR',
    resolucao,
    qualidade,
    view,
    formato='application/vnd.geo+json'
  }={},
  {...headers}={}
) =>
  fetch(queryParams(
    `http://servicodados.ibge.gov.br/api/v2/malhas/${id}`,
    Object
      .entries({resolucao, qualidade, view})
      .filter(([k, v]) => v !== undefined)
      .reduce((acc, [k, v]) => Object.assign(acc, {[k]: v}), {})
  ), {
    method: 'GET',
    headers: {
      Accept: formato,
      ...headers,
    }
  })


const maybeSelect = node =>
  (node instanceof d3.selection)
      ? node
      : d3.select(node)

module.exports = {
  mean,
  ibgeMalhas,
  Geo,
  maybeSelect,
}
