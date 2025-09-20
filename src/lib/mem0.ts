import MemoryClient from 'mem0ai';

interface MemoryClientConfig {
    apiKey: string;
}

const mem0 = new MemoryClient({ apiKey: process.env.MEM0_API_KEY as string });
export default mem0;