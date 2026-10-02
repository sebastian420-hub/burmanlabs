/**
 * Pulls the lazy 3D chunks through the network once, so the service worker caches
 * them and the globe and sims also work offline. Add each new native sim here.
 */
export const warmAll = () => Promise.allSettled([import("./Globe"), import("./OrbitSim")]);
