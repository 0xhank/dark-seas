import _ from "lodash";
import { useState } from "react";
import styled from "styled-components";
import { getChainSpec } from "../../mud/config";
import { Button, colors, Input, ShipContainer } from "../styles/global";
import { CopyableInput } from "./CopyableInput";

interface Setting {
  name: string;
  value: number;
  update: (value: number) => void;
}

type State = "unsubmitted" | "creating" | "created" | "failed";
export function CreateGame() {
  const [commitLength, setCommitLength] = useState(25);
  const [revealLength, setRevealLength] = useState(9);
  const [actionLength, setActionLength] = useState(25);
  const [worldSize, setWorldSize] = useState(120);
  const [perlinSeed, setPerlinSeed] = useState(69);
  const [entryCutoff, setEntryCutoff] = useState(20);
  const [shrinkRate, setShrinkRate] = useState(500);
  const [budget, setBudget] = useState(5);
  const [url, setUrl] = useState<string>();
  const [state, setState] = useState<State>("unsubmitted");

  const disabled = state == "creating";

  async function sendMessage() {
    if (url) return (location.href = url);
    const configData = {
      commitPhaseLength: commitLength,
      revealPhaseLength: revealLength,
      actionPhaseLength: actionLength,
      worldSize,
      perlinSeed,
      entryCutoffTurns: entryCutoff,
      buyin: 0,
      respawnAllowed: false,
      shrinkRate,
      budget,
    };
    setState("creating");
    try {
      const response = await fetch(`http://localhost:3001/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dev: getChainSpec().dev, configData }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const { worldAddress, blockNumber } = await response.json();
      setState("created");
      setUrl(`${window.location.origin}/?worldAddress=${worldAddress}&block=${blockNumber}`);
    } catch (e) {
      console.log("error:", e);
      setState("failed");
    }
  }

  const settings: Setting[] = [
    { name: "Commit phase length (seconds)", value: commitLength, update: setCommitLength },
    {
      name: "Reveal Phase Length (seconds)",
      value: revealLength,
      update: setRevealLength,
    },
    {
      name: "Action Phase Length (seconds)",
      value: actionLength,
      update: setActionLength,
    },
    {
      name: "World Size",
      value: worldSize,
      update: setWorldSize,
    },
    {
      name: "Perlin Seed",
      value: perlinSeed,
      update: setPerlinSeed,
    },
    {
      name: "Entry Cutoff (seconds)",
      value: entryCutoff,
      update: setEntryCutoff,
    },
    {
      name: "Shrink Rate (seconds)",
      value: shrinkRate,
      update: setShrinkRate,
    },
    { name: "Ship Purchasing Budget", value: budget, update: setBudget },
  ];

  return (
    <Container onClick={(e) => e.stopPropagation()}>
      <p style={{ fontSize: "1.25rem", textAlign: "center" }}>Avast! Create your world! </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflow: "auto" }}>
        {_.chunk(settings, 2).map((row) => (
          <div key={`row-${row}`} style={{ display: "flex", gap: "24px" }}>
            {row.map((setting) => (
              <div style={{ flex: 1 }} key={`setting-${setting.name}`}>
                <P>{setting.name}</P>
                <Input
                  style={{ width: "100%" }}
                  type="number"
                  placeholder={setting.name}
                  value={setting.value}
                  onChange={(e) => setting.update(Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      {state == "failed" && (
        <div style={{ color: colors.red, textAlign: "center" }}>Something went wrong. Please try again.</div>
      )}
      <Button onClick={sendMessage} disabled={disabled}>
        {state == "creating"
          ? "Deploying and initializing your world. This will take ~3 minutes -- please be patient!"
          : state == "created"
          ? "Enter Game"
          : "Create Game"}
      </Button>
      {url !== undefined && (
        <CopyableInput
          displayValue={"Share the game link with friends!"}
          copyText={`Join my game of Dark Seas! ${url}️`}
          onCopyError={() => {}}
        />
      )}
    </Container>
  );
}
const Container = styled(ShipContainer)`
  width: 50%;
  max-height: 80%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  padding: 8px;
  gap: 8px;
  cursor: auto;
`;

const P = styled.p`
  line-height: 1.25rem;
`;
