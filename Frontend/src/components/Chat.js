import React, { useState, useEffect } from "react";
import queryString from "query-string";
import io from "socket.io-client";
import InfoBar from "./InfoBar";
import Input from "./Input";
import Messages from "./Messages";
import TextContainer from "./TextContainer";

import "./Chat.css";
import ErrorModal from "./ErrorModal";
import { Link } from "react-router-dom";
import { Button } from "@material-ui/core";

let socket;

const Chat = ({ location }) => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState("");
  const ENDPOINT = "/";
  // const ENDPOINT = "http://localhost:5000/";

  const [info, setInfo] = useState(false);
  const [error, setError] = useState();
  const [socketOn, setSocketOn] = useState(true);

  useEffect(() => {
    const { name, room } = queryString.parse(location.search);
    // console.log(location);
    socket = io(ENDPOINT);
    console.log(socket);

    // console.log(socket.status);
    // console.log(socket.connection);
    console.log(socket.disconnected);
    console.log(socket.connected);
    // console.log(socket.id);
    console.log(socket);

    setRoom(room);
    setName(name);
    // console.log(room, name);

    socket.emit("join", {name, room }, (err) => {
      
      setError(err);

      if(socket.id) setSocketOn(true);
      else setSocketOn(false);
    });
  }, [ENDPOINT, location.search]);

  useEffect(() => {
    socket.on(
      "message",
      (message) => {
        setMessages([...messages, message]);
      },
      (err) => {
        setError(err);
      }
    );

    socket.on("roomData", ({ users }) => {
      setUsers(users);
    });

    return () => {
      socket.off();
    };
  }, [messages]);

  // useEffect(() => {

  // },[])

  const infoHandler = () => {
    setInfo((prevI) => !prevI);
  };

  const sendMessage = (event) => {
    event.preventDefault();

    if (message) {
      socket.emit("sendMessage", message, (err) => {
        setMessage("");
        setError(err);
      });
    }
  };

  console.log(message, messages);
  console.log(users);

  const clearError = () => {
    setError(null);
  };

  return (
    <React.Fragment>
      {(error || !socketOn) && (
        <ErrorModal
          heading="Some Error Occured"
          message={(error || "Can't connect to the room.") + " Please try again."}
          onClick={clearError}
        />
      )}

      <div className="outerContainer">
        <div className="innerContainer">
          {error && (
            <div>
              <div className="error-heading">Error Occured!</div>
              <div className="error-message">{error}! You need to go back.</div>
              <div className="error">
                <Button
                  variant="contained"
                  color="primary"
                  href="/"
                  size="large"
                  className="error-button"
                >
                  Go Back to the page
                </Button>
              </div>
            </div>
          )}
          {!error && <InfoBar room={room} onClick={infoHandler} />}
          {!error && !info && (
            <div className="chatBox">
              <div className="line"/>

              <Messages messages={messages} name={name} />
              <Input
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
              />
            </div>
          )}
          {!error && info && (
            <div>
              <TextContainer users={users} />
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default Chat;
