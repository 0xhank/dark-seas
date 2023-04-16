import { useState } from "react";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { Button, Input } from "../../styles/global";

export function RegisterName() {
  const [name, setName] = useState("");

  const {
    api: { spawn },
  } = useNetwork();

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleSpawnClick() {
    spawn(name);
  }
  return (
    <div
      style={{
        fontSize: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "6px",
      }}
    >
      <div style={{ fontSize: "1.5rem" }}>Welcome to Dark Seas</div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          width: "200px",
        }}
      >
        <Input
          style={{ width: "100%" }}
          type="text"
          id="player-name"
          value={name}
          placeholder="Enter your name"
          onChange={handleNameChange}
        />
        <Button disabled={name.length == 0} style={{ width: "100%" }} onClick={handleSpawnClick}>
          Spawn
        </Button>
      </div>
    </div>
  );
}
