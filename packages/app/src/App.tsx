import { useState, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { h, block } from "vdom";

const Button = block(({ number }: { number: number }) => {
  return h("button", null, number);
});

const button = Button({ number: 0 });

function App() {
  const [count, setCount] = useState(0);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    button.mount(buttonContainerRef.current);
  }, []);

  useEffect(() => {
    if (buttonContainerRef.current) {
      button.patch(Button({ number: count }));
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
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <div ref={buttonContainerRef}></div>
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
