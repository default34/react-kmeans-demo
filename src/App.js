import * as R from "rambdax"
import React, {useRef, useState, useCallback} from "react"
import {
  LineSegment,
  VictoryCursorContainer,
  VictoryChart, VictoryAxis, VictoryTheme, VictoryScatter,
  VictoryLabel,
} from "victory"
import {round, countBy, clusterByKMeans} from "./lib"
import db from "./db.json"

function App() {
  let ref = useRef()
  let [resumes, setResumes] = useState(db.resumes.map(R.omit(["english"])))
  let [centroidsLog, setCentroidsLog] = useState("...")
  let [clustersLog, setClustersLog] = useState("...")
  let [centroids, setCentroids] = useState([
    {experience: 8, salary: 7},
    {experience: 4, salary: 4},
    {experience: 2, salary: 2}
  ])

  let runIteration = useCallback(event => {
    let [updatedCentroids, clusteredFacts] =  clusterByKMeans(centroids, resumes)

    setCentroids(updatedCentroids)
    setResumes(clusteredFacts)

    let clusters = R.pipe(
      R.groupBy(R.prop("cluster")),
      R.map(countBy(R.prop("label")))
    )(clusteredFacts)

    setCentroidsLog(JSON.stringify(updatedCentroids, null, 2))
    setClustersLog(JSON.stringify(clusters, null, 2))
  })

  return (
    <div style={{padding: "2rem"}}>
      <h1>K-Means Clustering Demo</h1>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
        <div style={{backgroundColor: "white"}}>
          <VictoryChart
            theme={VictoryTheme.material}
            domain={{x: [0, 12], y: [0, 10]}}
            containerComponent={<VictoryCursorContainer
              cursorLabel={cursorLabel}
              cursorLabelComponent={<VictoryLabel style={{fontSize: 12, fill: "grey"}}/>}
              onCursorChange={(data) => {
                let {x, y} = data ? data : {x: 0, y: 0}
                ref.current = {experience: round(x, 1), salary: round(y, 1)}
              }}
              cursorComponent={<LineSegment style={{stroke: "grey", strokeDasharray: "4 4"}}/>}
            />}
          >
            <Scatter dataStyle={{fill: ({datum}) => colors[datum.cluster] || colors.default}} data={resumes}/>
            <Scatter dataStyle={{fill: "#ff0000"}} data={centroids}/>

            {makeAxisX()}
            {makeAxisY()}
          </VictoryChart>
        </div>

        <div style={{background: "white", padding: "0 1rem"}}>
          <Button onClick={runIteration}>
            Run Iteration
          </Button>

          <div style={{display: "flex"}}>
            <pre style={{padding: "1rem 0.5rem"}}>
              <code style={{fontSize: "1rem"}}>
                Centroids:
                {centroidsLog}
              </code>
            </pre>

            <pre style={{padding: "1rem 0.5rem"}}>
              <code style={{fontSize: "1rem"}}>
                Clusters:
                {clustersLog}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

function Scatter({data, dataStyle, ...rest}) {
  let cleanData = R.map(R.pick(["experience", "salary", "cluster"]), data)
  return <VictoryScatter
    {...rest}
    data={cleanData}
    size={3}
    style={{data: dataStyle}}
    x="experience"
    y="salary"
  />
}

let cursorLabel = ({datum}) => {
  return `(${datum.x.toFixed(1)}, ${datum.y.toFixed(1)})`
}

function makeAxisX() {
  return <VictoryAxis
    label="Experience, years"
    axisLabelComponent={<VictoryLabel dy={30}/>}
    tickValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
  />
}

function makeAxisY() {
  return <VictoryAxis
    axisLabelComponent={<VictoryLabel dy={-30}/>}
    dependentAxis={true}
    label="Salary, $"
    tickFormat={(t) => `${t}k`}
    tickValues={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
  />
}

function Button({onClick = null, children}) {
  return <button
    onClick={onClick}
    style={{
      background: "#fff",
      border: "0px",
      cursor: "pointer",
      fontSize: "24px",
      padding: "0.5rem",
    }}
  >
    {children}
  </button>
}

let colors = {
  0: "#026aa7",
  1: "#33bb33",
  2: "#ddbb33",
  default: "#999999",
}

export default App