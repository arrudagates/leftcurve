import { NextRequest } from "next/server";

async function getChatCompletion(tokenList: string) {
    let result = ''
    try {
        const response = await fetch('https://api.red-pill.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer sk-J9zAgRQb2AxMu5ZwknKsVrzhGnpcvQZcL8W3J3kMa7jKvkWL`,
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: `The following list contains crypto token names, choose 3 that have silly names and respond in the following format: tokenName1\\ntokenName2\\ntokenName3 , do not write anything else. The list of token names is: ${tokenList}` }],
                model: "gpt-4o-mini",
            })
        });
        const responseData = await response.json();
        result = (responseData.error) ? responseData.error : responseData.choices[0].message.content
    } catch (error) {
        console.error('Error fetching chat completion:', error)
        result = error as string
    }
    return result
}

export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
    const tokenList = await request.text();

    console.log(tokenList);

    const result = await getChatCompletion(tokenList);

    console.log(result);

    const tokens = result.split("\n");

    return Response.json({ tokens });
}