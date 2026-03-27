import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 24 * 60 * 60, // 24 hours for better performance
  checkperiod: 10 * 60, // 10 minutes
  maxKeys: 5000, // Increase capacity for better caching
});

export default cache;
