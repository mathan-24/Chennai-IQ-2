import express from 'express';

export function createHealthRouter(getState) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const state = getState ? getState() : { rainfallMm: 75, simulationMode: true };
    res.json({
      status: 'OPERATIONAL',
      system: 'CHENNAI-IQ AI Flood Access Risk Mapping & Dynamic Routing',
      runtime: 'Pure Vanilla HTML/CSS/JS with Express backend',
      rainfallMm: state.rainfallMm,
      simulationMode: state.simulationMode
    });
  });

  return router;
}

export default createHealthRouter;
