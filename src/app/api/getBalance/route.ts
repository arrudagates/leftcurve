import { http, createPublicClient, stringify } from 'viem'
import { baseSepolia, unichainSepolia } from 'viem/chains'
import superjson from 'superjson'
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const address = searchParams.get("address") as `0x${string}`;
    const network = searchParams.get("network");

    if (!address || !network) return;

    console.log(searchParams)

    const client = createPublicClient({
        chain: network === "unichain" ? unichainSepolia : baseSepolia,
        cacheTime: 0,
        transport: http(),
    })

    const balance = await client.getBalance({
        address,
    });

    console.log("balance: ", balance);

    const blockNumber = await client.getBlockNumber()

    console.log("block: ", blockNumber);

    return Response.json({ address: superjson.serialize(address).json, balance: superjson.serialize(balance).json });
}
