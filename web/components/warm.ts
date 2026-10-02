/**
 * Pulls the lazy chunks through the network once, so the service worker caches them
 * and the globe, sims and Studio pieces also work offline. Add each new one here.
 */
export const warmAll = () =>
  Promise.allSettled([
    import("./Globe"),
    import("./OrbitSim"),
    import("./art/Quantum"),
    import("./art/Pulse"),
    import("./art/Mandalay"),
    import("./art/BinaryRain"),
  ]);
