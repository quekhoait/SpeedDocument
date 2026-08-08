import NodeCache from 'node-cache';

const myCache = new NodeCache({ stdTTL: 300 }); 

export default myCache;