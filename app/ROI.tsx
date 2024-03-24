"use client";

import { useEffect, useState } from "react";
import portfolio from "./portfolio.json";

const WEEK_BALANCE = 839;
const WEEKLY_SOL = 176.05;

export default function ROI() {
  const [solPrice, setSolPrice] = useState(0);
  const [balance, setBalance] = useState(0);
  const [positions, setPositions] = useState({} as { [key: string]: number });

  async function getPositions() {
    const tokenAccounts = await fetch(
      "https://donnie-bx0ny6-fast-mainnet.helius-rpc.com/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTokenAccountsByOwner",
          params: [
            "D265nxGn6e62VC9oJ2gVjr2rcRTeTqwhPAqKZmXNBiYc",
            { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
            {
              encoding: "jsonParsed",
            },
          ],
        }),
      }
    );
    const tokenAccountsJson = await tokenAccounts.json();

    let wallet = {} as { [key: string]: number };

    for (let i = 0; i < tokenAccountsJson.result.value.length; i++) {
      const tokenAccount = tokenAccountsJson.result.value[i];
      const balance =
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
      const mint = tokenAccount.account.data.parsed.info.mint;

      if (balance > 0) {
        wallet[mint] = balance;
      }
    }

    const jupiterUrl = `https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112,${Object.keys(
      wallet
    ).join(",")}`;

    const jupiterResponse = await fetch(jupiterUrl);
    const jupiterJson = await jupiterResponse.json();

    setSolPrice(
      jupiterJson.data["So11111111111111111111111111111111111111112"].price ?? 0
    );

    let walletBalance = 0;

    const tokens = Object.keys(jupiterJson.data).filter(
      (t) => t !== "So11111111111111111111111111111111111111112"
    );
    let values = {} as { [key: string]: number };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const balance = wallet[token];
      const price = jupiterJson.data[token].price;
      const mintSymbol = jupiterJson.data[token].mintSymbol;

      const value = balance * price;

      walletBalance += value;
      values[mintSymbol] = value;
    }

    return values;
  }

  useEffect(() => {
    getPositions().then((wallet) => {
      setPositions(wallet);
      const total = Object.values(wallet).reduce((a, b) => a + b, 0);
      setBalance(total);
    });
  }, []);

  return (
    <div className="flex flex-col items-center py-2">
      <h1 className="text-6xl font-bold">
        {balance.toLocaleString("en-US", {
          currency: "USD",
          style: "currency",
        })}
      </h1>
      <h2
        className="text-lg"
        style={{ color: balance > 1000 ? "green" : "red" }}
      >
        Overall ROI:{" "}
        {(balance - 1000).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}{" "}
        ({(((balance - 1000) / 1000) * 100).toFixed(2)}%)
      </h2>
      <h2
        className="text-lg"
        style={{ color: balance > WEEK_BALANCE ? "green" : "red" }}
      >
        Weekly ROI:{" "}
        {(balance - WEEK_BALANCE).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}{" "}
        ({(((balance - WEEK_BALANCE) / WEEK_BALANCE) * 100).toFixed(2)}%)
      </h2>
      <h2
        className="text-lg"
        style={{ color: solPrice > 179.5218 ? "green" : "red" }}
      >
        Overall SOL ROI:{" "}
        {(solPrice * (1000 / 179.5218) - 1000).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })}{" "}
        ({(100 * (solPrice / 179.5218 - 1)).toFixed(2)}%)
      </h2>
      <h2
        className="text-lg"
        style={{ color: solPrice > 179.5218 ? "green" : "red" }}
      >
        Weekly SOL ROI:{" "}
        {(solPrice * (WEEK_BALANCE / WEEKLY_SOL) - WEEK_BALANCE).toLocaleString(
          "en-US",
          {
            style: "currency",
            currency: "USD",
          }
        )}{" "}
        ({(100 * (solPrice / WEEKLY_SOL - 1)).toFixed(2)}%)
      </h2>
      <table className="m-8 text-xs">
        <tr>
          <th>Ticker</th>
          <th>Value</th>
          <th>Basis</th>
          <th>Return</th>
          <th>ROI</th>
        </tr>
        {Object.keys(positions)
          .sort((a, b) => positions[b] - positions[a])
          .map((mint) => {
            const portfolioValue =
              (portfolio.find((p) => p.symbol === mint)?.weight ?? 0) *
              WEEK_BALANCE;
            const absoluteReturn = positions[mint] - portfolioValue;
            const ROI =
              portfolioValue === 0
                ? Number.POSITIVE_INFINITY
                : absoluteReturn / portfolioValue;

            return (
              <tr key={mint}>
                <td className="px-2">{mint}</td>
                <td className="px-2">
                  {positions[mint].toLocaleString("en-US", {
                    currency: "USD",
                    style: "currency",
                  })}
                </td>
                <td className="px-2">
                  {portfolioValue.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td
                  className="px-2"
                  style={{ color: absoluteReturn > 0 ? "green" : "red" }}
                >
                  {absoluteReturn.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })}
                </td>
                <td
                  className="px-2"
                  style={{ color: absoluteReturn > 0 ? "green" : "red" }}
                >
                  {(ROI * 100).toFixed(2)}%
                </td>
              </tr>
            );
          })}
      </table>
    </div>
  );
}
