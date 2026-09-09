import express from 'express';

export function createSimulationRouter(getState, setState) {
  const router = express.Router();

  router.post('/rainfall', (req, res) => {
    const { rainfallMm, isSimulation = true } = req.body || {};
    if (typeof rainfallMm !== 'number' || rainfallMm < 0 || rainfallMm > 500) {
      return res.status(400).json({ error: 'Rainfall must be a positive number up to 500mm' });
    }
    const previous = getState().rainfallMm;
    setState({ rainfallMm, simulationMode: isSimulation });
    res.json({
      previousRainfallMm: previous,
      currentRainfallMm: rainfallMm,
      simulationMode: isSimulation,
      status: 'UPDATED'
    });
  });

  return router;
}

export default createSimulationRouter;
