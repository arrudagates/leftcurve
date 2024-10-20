import superjson from 'superjson'
import { NextRequest } from 'next/server';
import { createClient, gql } from 'urql';
import { cacheExchange, fetchExchange } from '@urql/core';

const client = createClient({

    url: 'https://gateway.thegraph.com/api/e0bd3e3a667afb79226af435ff96617e/subgraphs/id/5Tf9s7syYLHQzhmtjukjTjmhFwx7c3hrdVxy4jo3TgCC',

    exchanges: [cacheExchange, fetchExchange],

});

const DATA_QUERY = gql`{
  
    tokens(where: {totalValueLocked_gt:0}) {
        name
        id
        symbol
        decimals
        volume
        totalValueLocked
    }
  
  }`;

export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const network = searchParams.get("network");

    if (!network) return;

    if (network === "unichain") {
        const result = await client.query(DATA_QUERY, {}).toPromise();

        const tokens = result.data.tokens.map(({ name, id, decimals, symbol, totalValueLocked, volume }) => {
            return { name, id, decimals, symbol, totalValueLocked, volume };
        });

        return Response.json(tokens);
    }

    return Response.json({});
}
