import * as R from "rambdax"

// Helpers ====================================================================================

export let min = arr => {
  return Math.min(...arr)
}

// Collections =====================================================================================
export let countBy = R.curry((get, xs) => {
  return xs.reduce((z, x) => {
    let k = get(x) // "a"
    return {...z, [k]: z[k] == null ? 1 : z[k] + 1}
  }, {})
})

// Math ============================================================================================
export let pow = R.curry((a, b) => {
  return a ** b
})

export let powTo = R.flip(pow)

export let round = (num, prec) => {
  return Number(num.toFixed(prec))
}

export let roundTo = R.flip(round)

// M-L =============================================================================================
export let scale = (ns) => {
  let min = R.reduce(R.min, +Infinity, ns)
  let max = R.reduce(R.max, -Infinity, ns)
  return ns.map(n => (n - min) / (max - min))
}

export let scaleFacts = (facts) => {
  if (!facts.length) {
    return []
  }

  let scaledValues = R.pipe(
    R.keys,
    R.filter(k => k != "label"),
    R.reduce((z, k) => ({...z, [k]: R.pluck(k, facts)}), {}),
    R.map(x => R.map(roundTo(2), scale(x)))
  )(facts[0])

  return facts.map((fact, i) =>
    R.map((v, k) => k == "label" ? v : scaledValues[k][i], fact)
  )
}

export let getDistance = R.curry((record1, record2) => {
  let keys1 = R.keys(record1).filter(k => k != "label")
  let keys2 = R.keys(record2).filter(k => k != "label")
  let uniqKeys = R.uniq([...keys1, ...keys2])
  return R.pipe(
    R.map(k => (record1[k] - record2[k]) ** 2),
    R.sum,
    powTo(0.5),
  )(uniqKeys)
})

export let distances = R.curry((centroids, givenFacts) => {
    return R.map(fact => R.map(getDistance(fact), centroids), givenFacts)
})

export let labels = (distances) => {
  return R.map(distance => R.indexOf(min(distance), distance), distances)
}

export let classifyFacts = R.curry((givenFacts, labels) => {
  return givenFacts.map((fact, i) =>
    ({...fact, cluster: labels[i]}))
})

export let clusterByKMeans = (centroids, givenFacts) => {
  let scaledGivenFacts = scaleFacts(R.map(R.omit(["cluster", "label"]), givenFacts))
  let scaledCentroids = scaleFacts(centroids)

  let clusteredFacts = R.pipe(
    distances(scaledCentroids),
    labels,
    classifyFacts(givenFacts)
  )(scaledGivenFacts)

  let updatedCentroids = R.pipe(
    R.groupBy(fact => fact.cluster),
    R.values,
    R.map(xs => ({experience: roundTo(2, R.mean(R.pluck("experience", xs))),
                  salary: roundTo(2, R.mean(R.pluck("salary", xs)))}))
  )(clusteredFacts)

  return [
    updatedCentroids,
    clusteredFacts
  ]
}