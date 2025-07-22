import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: 60 * 60, // 1 hour
  checkperiod: 5 * 60, // 5 minutes
  maxKeys: 1000, // Maximum number of keys
});

export default cache;
