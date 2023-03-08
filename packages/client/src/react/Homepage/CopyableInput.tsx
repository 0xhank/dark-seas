import React, { useState } from "react";
import styled from "styled-components";
import { Button, colors } from "../styles/global";

const onCopy = (textToCopy: string, onCopySuccess: () => void, onCopyError: (msg: string) => void) => {
  if (!navigator.clipboard) {
    onCopyError("Clipboard API not supported");
    return;
  }
  navigator.clipboard.writeText(textToCopy).then(
    () => {
      console.log("Async: Copying to clipboard was successful!");
      onCopySuccess();
    },
    (err) => {
      console.error("Async: Could not copy text: ", err);
      onCopyError("Couldn't copy to clipboard");
    }
  );
};

export const CopyableInput: React.FC<{
  copyText: string;
  displayValue?: string;
  onCopyError: (msg: string) => void;
}> = ({ copyText, displayValue, onCopyError }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const handleCopySuccess = () => {
    setCopied(true);
  };
  return (
    <Container>
      <Button style={{ width: "100%" }} secondary onClick={() => onCopy(copyText, handleCopySuccess, onCopyError)}>
        {displayValue}
      </Button>
      <div
        style={{
          position: "absolute",
          right: 12,
          color: colors.green,
          height: "36px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {copied && "✓ Copied"}
      </div>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
`;
