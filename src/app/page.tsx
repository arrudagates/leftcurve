// src/app/page.tsx
"use client";
import Image from "next/image";
import styles from "./page.module.css";
import 'dotenv/config';
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
import { unichainSepolia } from "viem/chains";
import { createWalletClient, custom, http, PrivateKeyAccount, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AlphaRouter, SwapType } from '@uniswap/smart-order-router'
import { ChainId } from "@uniswap/sdk-core";
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import { ethers } from 'ethers'
import { createPublicClient } from 'viem'
import { JsonRpcProvider } from 'ethers'

type TOKEN = { name: string; id: string; decimals: number; symbol: string; totalValueLocked: number; volume: number; };

const AMOUNT_TO_APE = BigInt("100000000000000");
const AMOUNT_FOR_FEES = BigInt("100000000000000");

export default function Home() {
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [balance, setBalance] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TOKEN[]>([]);
  const [aiTokens, setAITokens] = useState<[string, string, string] | null>(null);

  // Define the function to be called on button click
  const handleClick = async (path: string) => {
    try {
      const response = await fetch(path);
      const data = await response.json();
      console.log(JSON.stringify(data))
      alert(JSON.stringify(data));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const { login } = useLogin();

  const { ready, user, authenticated, logout } = usePrivy();

  const { wallets } = useWallets();

  const getTeeKey = async (): Promise<{ account: string; privateKey: string }> => {
    const response = await fetch(`/api/deriveKey`);
    const data = await response.json();
    console.log(JSON.stringify(data))
    return data;
  };

  const getBalance = async (address: `0x${string}`, network: string): Promise<string> => {

    const response = await fetch(`/api/getBalance?address=${address}&network=${network}`);
    const data = await response.json();
    console.log(JSON.stringify(data))
    return data.balance;

  };

  const getTokens = async (network: string): Promise<TOKEN[]> => {
    const response = await fetch(`/api/getTokens?network=${network}`);
    const data = await response.json();
    console.log(JSON.stringify(data))
    return data;
  };

  const fetchTokens = async () => {
    const tokens = await getTokens(selectedChain);

    setTokens(tokens);
  };

  const getAITokens = async (tokens: TOKEN[]): Promise<[string, string, string]> => {
    const mapped = tokens.map(({ name }) => name);

    const response = await fetch(`/api/aiProcess`, {
      method: "POST",
      body: JSON.stringify(mapped)
    });

    const data = await response.json();

    console.log(JSON.stringify(data));

    return data.tokens;

  };

  const doAIProcess = async () => {
    const aiTokens = await getAITokens(tokens);

    setAITokens(aiTokens);
  };

  const fetchTokensAndAIProcess = async () => {
    const fetchedTokens = await getTokens(selectedChain);

    setTokens(fetchedTokens);

    const aiTokens = await getAITokens(fetchedTokens);

    setAITokens(aiTokens);

  }

  const doSwap = async (outputTokenData: TOKEN, amountIn: string, client: WalletClient, teeAccount: PrivateKeyAccount) => {
    if (!user?.wallet?.address) {
      console.error("User wallet address not available");
      return;
    }

    const chainId = unichainSepolia.id;
    const provider = new JsonRpcProvider(unichainSepolia.rpcUrls.default.http[0]);

    const router = new AlphaRouter({ chainId, provider });

    const WETH = new Token(
      chainId,
      '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH address on Unichain Sepolia
      18,
      'WETH',
      'Wrapped Ether'
    );

    const outputToken = new Token(
      chainId,
      outputTokenData.id,
      outputTokenData.decimals, // Assuming 18 decimals, adjust if necessary
      outputTokenData.symbol,
      outputTokenData.name
    );

    const wei = ethers.parseEther(amountIn);
    const inputAmount = CurrencyAmount.fromRawAmount(WETH, wei.toString());

    try {
      const route = await router.route(
        inputAmount,
        outputToken,
        TradeType.EXACT_INPUT,
        {
          recipient: user.wallet.address,
          slippageTolerance: new Percent(5, 100),
          deadline: Math.floor(Date.now() / 1000 + 1800), // 30 minutes from now
          type: SwapType.SWAP_ROUTER_02,
        }
      );

      if (!route || !route.methodParameters) {
        console.error("No route found");
        return;
      }

      const hash = await client.sendTransaction({
        account: teeAccount,
        chain: unichainSepolia,
        data: route.methodParameters.calldata as `0x${string}`,
        to: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Universal Router address on Unichain Sepolia
        value: BigInt(route.methodParameters.value),
        from: user.wallet.address,
        gasPrice: route.gasPriceWei.toBigInt(),
        gasLimit: BigInt(route.estimatedGasUsed.toString()) * BigInt(2),
      });

      console.log(`Transaction sent: ${hash}`);
    } catch (error) {
      console.error("Error in doSwap:", error);
    }
  };

  const buyTokens = async () => {
    if (!aiTokens) return;

    const tokensToBuy = aiTokens.map((t) => {
      const maybeFound = tokens.find(({ name }) => t.trim() == name.trim());

      if (!maybeFound) throw "Something went wrong...";

      return maybeFound;
    });

    const teePrivateKey = await getTeeKey();

    console.log("tee key: ", teePrivateKey);

    const wallet = wallets[0];

    await wallet.switchChain(unichainSepolia.id);

    const provider = await wallet.getEthereumProvider();
    const walletClient = createWalletClient({
      chain: unichainSepolia,
      transport: custom(provider),
    });

    const hash = await walletClient.sendTransaction({
      account: (await walletClient.getAddresses())[0],
      to: teePrivateKey.account as `0x${string}`,
      //value: (AMOUNT_TO_APE * BigInt("3")) + AMOUNT_FOR_FEES
      value: AMOUNT_TO_APE / BigInt(10)
    });

    const teeWalletClient = createWalletClient({
      chain: unichainSepolia,
      transport: http(),
    });

    const teeAccount = privateKeyToAccount(teePrivateKey.privateKey as `0x${string}`);


  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (user?.wallet?.address) {
        console.log("address: ", user.wallet.address);

        const newBalance = await getBalance(user.wallet.address, selectedChain);

        setBalance(newBalance);
      }
    };

    fetchBalance();
  }, [selectedChain]);

  const handleChainChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChain(event.target.value);
    console.log("Selected chain:", event.target.value);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <button
          className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
          onClick={login}
        >Login</button>

        <select
          value={selectedChain}
          onChange={handleChainChange}
          className="mt-4 p-2 rounded-lg border border-gray-300"
        >
          <option value="unichain">Unichain</option>
          <option value="base">Base</option>
        </select>

        <div className="mt-4 p-2 rounded-lg border border-gray-300">
          Balance: {balance !== null ? balance : 'Loading...'}
        </div>

        <button
          className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
          onClick={fetchTokensAndAIProcess}
        >Get tokens</button>

        <button
          className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
          onClick={buyTokens}
        >Buy</button>

        <div className="mt-4 p-2 rounded-lg border border-gray-300">
          Your new memecoins: {aiTokens !== null ? `${aiTokens[0]}, ${aiTokens[1]}, ${aiTokens[2]}` : 'Loading...'}
        </div>

      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
