import { useEffect, useRef, useState } from "react";
import { socket } from "../socket.js";

/**
 * يدير اتصال طاولة لعبة واحدة عبر السوكِت.
 * يُرجع: { phase, lobby, game, you, error, start(), action(a), leave() }
 *  - phase: "connecting" | "lobby" | "playing"
 *  - lobby: حالة اللوبي (اللاعبون/المضيف) قبل البدء
 *  - game:  { state, turn, over } أثناء اللعب
 */
export function useGameTable({ gameId, mode, user }) {
  const [phase, setPhase] = useState("connecting");
  const [lobby, setLobby] = useState(null);
  const [game, setGame] = useState(null);
  const [you, setYou] = useState(null);
  const [error, setError] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onJoined = ({ tableId, you }) => {
      tableRef.current = tableId;
      setYou(you);
    };
    const onLobby = (lob) => {
      setLobby(lob);
      setPhase("lobby");
    };
    const onState = (g) => {
      setGame(g);
      setPhase("playing");
    };
    const onError = ({ message }) => setError(message);

    socket.on("game:joined", onJoined);
    socket.on("game:lobby", onLobby);
    socket.on("game:state", onState);
    socket.on("game:error", onError);

    socket.emit("game:join", { gameId, mode, user });

    return () => {
      socket.emit("game:leave");
      socket.off("game:joined", onJoined);
      socket.off("game:lobby", onLobby);
      socket.off("game:state", onState);
      socket.off("game:error", onError);
    };
    // gameId/mode ثابتة طوال عمر هذا المكوّن
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, mode]);

  const start = () => socket.emit("game:start");
  const action = (a) => socket.emit("game:action", a);
  const leave = () => socket.emit("game:leave");

  return { phase, lobby, game, you, error, start, action, leave };
}
