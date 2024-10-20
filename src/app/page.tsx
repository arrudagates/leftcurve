// src/app/page.tsx
"use client";
import Image from "next/image";
import styles from "./page.module.css";
import 'dotenv/config';
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";

type TOKEN = { name: string; id: string; decimals: number; symbol: string; totalValueLocked: number; volume: number; };

const AMOUNT_TO_APE = 100000000000000;
const AMOUNT_FOR_FEES = 100000000000000;

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

    const aiTokens = await getAITokens(fetchedTokens);

    setAITokens(aiTokens);

  }

  const buyTokens = async () => {
    if (!aiTokens) return;

    const tokensToBuy = aiTokens.map((t) => {
      const maybeFound = tokens.find(({ name }) => t === name);
      if (!maybeFound) throw "Something went wrong...";

      return maybeFound;
    });


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
