import _ from "lodash";
import { useState } from "react";
import styled from "styled-components";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { Button, Input } from "../../styles/global";
interface Setting {
  name: string;
  value: number;
  update: (value: number) => void;
}

export function CreateGame() {
  const {
    api: { createGame },
  } = useNetwork();
  const [commitLength, setCommitLength] = useState(25);
  const [revealLength, setRevealLength] = useState(9);
  const [actionLength, setActionLength] = useState(25);
  const [worldSize, setWorldSize] = useState(120);
  const [perlinSeed, setPerlinSeed] = useState(69);
  const [entryCutoff, setEntryCutoff] = useState(20);
  const [shrinkRate, setShrinkRate] = useState(500);
  const [budget, setBudget] = useState(5);
  const [islandThreshold, setIslandThreshold] = useState(33);

  const settings: Setting[] = [
    { name: "Commit phase length (s)", value: commitLength, update: setCommitLength },
    {
      name: "Reveal Phase Length (s)",
      value: revealLength,
      update: setRevealLength,
    },
    {
      name: "Action Phase Length (s)",
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
      name: "Entry Cutoff (s)",
      value: entryCutoff,
      update: setEntryCutoff,
    },
    {
      name: "Shrink Rate (per turn) ",
      value: shrinkRate,
      update: setShrinkRate,
    },
    { name: "Ship Purchasing Budget", value: budget, update: setBudget },
    { name: "Island size (out of 100)", value: islandThreshold, update: setIslandThreshold },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "6px", maxWidth: "600px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflow: "auto" }}>
        {_.chunk(settings, 2).map((row, i) => (
          <div key={`row-${i}`} style={{ display: "flex", gap: "24px" }}>
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
      <Button
        secondary
        onClick={() => {
          createGame({
            startTime: 0,
            startBlock: 0,
            commitPhaseLength: commitLength,
            revealPhaseLength: revealLength,
            actionPhaseLength: actionLength,
            worldSize,
            perlinSeed,
            entryCutoffTurns: entryCutoff,
            buyin: 0,
            shrinkRate,
            budget,
            islandThreshold,
          });
        }}
      >
        Create Game
      </Button>
    </div>
  );
}

const P = styled.p`
  line-height: 1.25rem;
`;