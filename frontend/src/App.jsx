import { useEffect, useState } from "react";

function App() {
  const [socket, setSocket] = useState(null);
  const [receivedMsg, setReceivedMsg] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "SUBSCRIBE" }));
      console.log("connection with websocket established");
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      setReceivedMsg((receivedMsg) => receivedMsg.concat(data.message));
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  return (
    <div>
      {receivedMsg.map((msg) => (
        <div>{msg}</div>
      ))}
    </div>
  );
}

export default App;
