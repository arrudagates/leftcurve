import { TappdClient } from '@phala/dstack-sdk'
import 'dotenv/config'
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256 } from "viem";

const endpoint = process.env.DSTACK_SIMULATOR_ENDPOINT || 'http://localhost:8090'

export const dynamic = 'force-dynamic'
export async function GET() {
  console.log(endpoint)

  const client = new TappdClient(endpoint)

  const deriveKey = await client.deriveKey("left", "curve");

  const keccakPrivateKey = keccak256(deriveKey.asUint8Array());

  const account = privateKeyToAccount(keccakPrivateKey);

  console.log(account);

  return Response.json({ account: account.address, privateKey: keccakPrivateKey });
}
