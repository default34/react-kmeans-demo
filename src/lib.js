import * as R from "rambdax"

// Dev. Helpers ====================================================================================
export let logAs = (label) => {
  return function (x) {
    console.log(label + ":", x)
    return x
  }
}

// Collections =====================================================================================
export let minimum = arr => {
  return Math.min(...arr)
}

export let maximum = arr => {
  return Math.max(...arr)
}

export let countBy = R.curry((fn, xs) => {
  return R.map(R.length, R.groupBy(fn, xs))
})

export let invert = (obj) => {
  return R.keys(obj).reduce((z, k) => {
    let v = obj[k]
    return {...z, [v]: k}
  }, {})
}

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

export let classifyFacts = R.curry((givenFacts, labels) => {
  return R.mapIndexed((fact, i) => ({...fact, cluster: labels[i]}), givenFacts)
})

export let clusterByKMeans = (centroids, givenFacts) => {
  let scaledGivenFacts = scaleFacts(R.map(R.omit(["cluster", "label"]), givenFacts))
  let scaledCentroids = scaleFacts(centroids)

  let clusteredFacts = R.pipe(
    R.map(fact => R.map(getDistance(fact), scaledCentroids)),
    R.map(distance => R.indexOf(minimum(distance), distance)),
    classifyFacts(givenFacts)
  )(scaledGivenFacts)

  let updatedCentroids = R.pipe(
    R.groupBy(fact => fact.cluster),
    R.values,
    R.map(xs => ({
      experience: roundTo(2, R.mean(R.pluck("experience", xs))),
      salary: roundTo(2, R.mean(R.pluck("salary", xs)))
    }))
  )(clusteredFacts)

  return [
    updatedCentroids,
    clusteredFacts
  ]
}
