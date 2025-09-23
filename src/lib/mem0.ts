import MemoryClient from 'mem0ai';

// Initialize mem0 with required configuration
const mem0 = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY as string,
  // Remove api_version as it's not a valid option
  // The client will use the default API version
});

export default mem0;