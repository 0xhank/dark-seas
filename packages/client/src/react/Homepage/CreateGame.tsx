import _ from "lodash";
import { useState } from "react";
import styled from "styled-components";
import { Button, Input, ShipContainer } from "../styles/global";
import { CopyableInput } from "./CopyableInput";

interface Setting {
  name: string;
  value: number;
  update: (value: number) => void;
}

type State = "unsubmitted" | "creating" | "created";
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
        body: JSON.stringify(configData),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const { worldAddress, blockNumber } = await response.json();
      setState("created");
      setUrl(`${window.location.origin}/?worldAddress=${worldAddress}&blockNumber=${blockNumber}`);
    } catch (e) {
      console.log("error:", e);
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
          <div style={{ display: "flex", gap: "24px" }}>
            {row.map((setting) => (
              <div style={{ flex: 1 }}>
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
      <Button onClick={sendMessage} disabled={disabled}>
        {state == "unsubmitted" ? "Create Game" : state == "creating" ? "Creating..." : "Enter Game"}
      </Button>
      {url !== undefined && (
        <CopyableInput
          displayValue={"Click here to share game link with your friends"}
          copyText={`Invite friends to your game here: ${url}️`}
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
