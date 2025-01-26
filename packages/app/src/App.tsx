import { useState, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { h, block } from "vdom";

const Button = block(
  ({ number, onClick }: { number: number; onClick: () => void }) =>
    h("button", { onClick }, number)
);

function App() {
  const [count, setCount] = useState(0);
  const buttonRef = useRef<HTMLDivElement>(null);
  const buttonInstanceRef = useRef<ReturnType<typeof Button> | null>(null);

  const createButtonInstance = () =>
    Button({
      number: count,
      onClick: () => setCount((prev) => prev + 1),
    });

  useEffect(() => {
    if (buttonRef.current) {
      buttonInstanceRef.current = createButtonInstance();
      buttonInstanceRef.current.mount(buttonRef.current);
    }
  }, []);

  useEffect(() => {
    if (buttonInstanceRef.current) {
      buttonInstanceRef.current.patch(createButtonInstance());
    }
  }, [count]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <div ref={buttonRef}></div>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
