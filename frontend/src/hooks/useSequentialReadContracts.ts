import { useQuery } from '@tanstack/react-query';
import { readContract } from '@wagmi/core';
import { config } from '../config/wagmi';

export function useSequentialReadContracts({ contracts, query }: any) {
  // Sanitize queryKey to prevent BigInt serialization crashes in React Query
  const safeKey = contracts?.map((c: any) => {
    if (!c) return null;
    return {
      address: c.address,
      functionName: c.functionName,
      args: c.args?.map((a: any) => typeof a === 'bigint' ? a.toString() : a)
    };
  });

  return useQuery({
    queryKey: ['sequentialRead', safeKey],
    queryFn: async () => {
      if (!contracts || contracts.length === 0) return [];
      const results = await Promise.all(
        contracts.map(async (c: any) => {
          if (!c) return { result: undefined, status: 'failure' };
          try {
            const data = await readContract(config, {
              address: c.address,
              abi: c.abi,
              functionName: c.functionName,
              args: c.args,
              chainId: c.chainId,
            });
            return { result: data, status: 'success' };
          } catch (e: any) {
            console.error("Sequential Read Error:", c.functionName, e);
            return { error: e, status: 'failure', result: undefined };
          }
        })
      );
      return results;
    },
    enabled: query?.enabled !== false && !!contracts && contracts.length > 0,
    refetchInterval: query?.refetchInterval,
  });
}
