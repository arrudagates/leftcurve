// src/app/page.tsx
"use client";
import Image from "next/image";
import styles from "./page.module.css";
import 'dotenv/config';
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";

export default function Home() {
  const [selectedChain, setSelectedChain] = useState("ethereum");
  const [balance, setBalance] = useState<string | null>(null);

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
    alert(JSON.stringify(data));

    return data.balance;

  };

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
      <button
        className="bg-violet-600 hover:bg-violet-700 py-3 px-6 text-white rounded-lg"
        onClick={login}
      >Login</button>

      <select
        value={selectedChain}
        onChange={handleChainChange}
        className="mt-4 p-2 rounded-lg border border-gray-300"
      >
        <option value="ethereum">Ethereum</option>
        <option value="base">Base</option>
      </select>

      <div className="mt-4 p-2 rounded-lg border border-gray-300">
        Balance: {balance !== null ? balance : 'Loading...'}
      </div>

      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol>
          <li>
            Generate a Remote Attestation.
          </li>
          <li>Derive a Key.</li>
          <li>Get Last Block.</li>
        </ol>

        <div className={styles.ctas}>
          <a className={styles.primary} target="_blank"
            rel="noopener noreferrer" onClick={() => handleClick('/api/remoteAttestation')}>
            Remote Attestation
          </a>
          <a className={styles.secondary} target="_blank"
            rel="noopener noreferrer" onClick={() => handleClick('/api/deriveKey')}>
            Derive Key
          </a>
          <a className={styles.primary} target="_blank"
            rel="noopener noreferrer" onClick={() => handleClick('/api/getLastBlock')}>
            Last Block
          </a>
        </div>
      </main>
      <footer className={styles.footer}>
        <a
          href="https://bit.ly/dstack-cheat-sheet"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://docs.phala.network/references/hackathon-guides/ethglobal-sf-hackathon-guide"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Guide
        </a>
        <a
          href="https://github.com/Phala-Network/nextjs-viem-dstack-template"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to Code →
        </a>
      </footer>
    </div>
  );
}
