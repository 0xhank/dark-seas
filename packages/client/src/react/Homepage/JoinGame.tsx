import { ethers } from "ethers";
import { useState } from "react";
import styled from "styled-components";
import { Button, colors, Input, ShipContainer } from "../styles/global";

export function JoinGame() {
  const [worldAddress, setWorldAddress] = useState<string>("");
  const [blockNumber, setBlockNumber] = useState<number>();
  const validAddress = ethers.utils.isAddress(worldAddress);
  return (
    <Container onClick={(e) => e.stopPropagation()}>
      <p style={{ lineHeight: "2rem", textAlign: "center" }}>
        Arr! Enter the world address and block number of the game to join.
      </p>
      <Input
        type="text"
        placeholder="World Address"
        onChange={(e) => setWorldAddress(e.target.value.toLowerCase())}
        value={worldAddress}
      ></Input>
      <Input
        type="number"
        value={blockNumber}
        placeholder="Block Number"
        onChange={(e) => setBlockNumber(Number(e.target.value))}
      ></Input>
      <Button disabled={!validAddress || !blockNumber}>
        <A href={`/?worldAddress=${worldAddress}&block=${blockNumber}`}>Join Game</A>
      </Button>
    </Container>
  );
}

const Container = styled(ShipContainer)`
  width: 50%;
  display: flex;
  justify-content: center;
  padding: 8px;
  gap: 8px;
`;

const A = styled.a`
  width: 100%;
  height: 100%;
  color: ${colors.darkBrown};
  text-decoration: none;
`;
