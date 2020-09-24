import * as R from "rambdax"

// Dev. Helpers ====================================================================================
export let logAs = (label) => {
  return function (x) {
    console.log(label + ":", x)
    return x
  }
}

// Collections =====================================================================================
export let reduce1 = R.curry((fn, xs) => {
  if (!xs.length) throw new Error("xs must not be empty")
  let [head, ...tail] = xs
  return R.reduce(fn, head, tail)
})

export let minimum = (xs) => reduce1(R.min, xs)

export let maximum = (xs) => reduce1(R.max, xs)

export let minimumBy = (fn, xs) => {
  return reduce1((x0, xi) => fn(x0) < fn(xi) ? x0 : xi, xs)
}

export let maximumBy = (fn, xs) => {
  return reduce1((x0, xi) => fn(x0) > fn(xi) ? x0 : xi, xs)
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

export let meanByProp = R.curry((prop, xs) => {
  return R.mean(R.pluck(prop, xs))
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

export let clustersByKMeans = (centroids, facts) => {
  let labels = R.map(R.prop("label"), centroids)

  let scaledGivenFacts = scaleFacts(R.map(R.omit(["cluster", "label"]), facts))
  let scaledCentroids = scaleFacts(centroids) // [{label}, {label}, {label}]

  let clusteredFacts = R.mapIndexed((fact, i) => {
    let measuredCentroids = R.map(centroid => ({...centroid, _distance: getDistance(fact, centroid)}), scaledCentroids)
    let closestCentroid = minimumBy(R.prop("_distance"), measuredCentroids)
    return {...facts[i], cluster: closestCentroid.label}
  }, scaledGivenFacts)

  let newCentroids = R.map(label => {
    let labelFacts = R.filter(R.propEq("cluster", label), clusteredFacts)
    return {
      label,
      experience: roundTo(2, meanByProp("experience", labelFacts)),
      salary: roundTo(2, meanByProp("salary", labelFacts)),
    }
  }, labels)

  return [
    newCentroids,
    clusteredFacts,
  ]
}
