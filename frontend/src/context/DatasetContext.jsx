import { createContext, useContext, useState } from 'react'
const Ctx = createContext(null)
export const useDataset = () => useContext(Ctx)
export function DatasetProvider({ children }) {
  const [dataset, setDataset] = useState(null)   // raw dataset row
  const [analysis, setAnalysis] = useState(null) // analysis result
  return <Ctx.Provider value={{ dataset, setDataset, analysis, setAnalysis }}>{children}</Ctx.Provider>
}
