import React, { useState, useContext } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const { user, logout } = useContext(AuthContext);
  const username = user?.name || user?.email;

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room Id is generated");
  };

  const joinRoom = () => {
    if (!roomId) {
      toast.error("Room ID is required");
      return;
    }

    navigate(`/editor/${roomId}`, {
      state: { username },
    });

    toast.success("Room joined");
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  return (
    <div className="container-fluid">
      <div className="row justify-content-center align-items-center min-vh-100">
        <div className="col-12 col-md-6">
          <div className="card shadow-sm p-2 mb-5 bg-secondary rounded">
            <div className="card-body text-center bg-dark">
              <img
  src="/images/codecast.svg"
  alt="CodeSync Live"
  style={{ height: "80px", width: "auto" }}
/>


              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="text-light">Logged in as: <b>{username}</b></span>
                <button className="btn btn-outline-light btn-sm" onClick={logout}>
                  Logout
                </button>
              </div>

              <h4 className="card-title text-light mb-4 mt-3">Enter the ROOM ID</h4>

              <div className="form-group">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="form-control mb-2"
                  placeholder="ROOM ID"
                  onKeyUp={handleInputEnter}
                />
              </div>

              <button
                onClick={joinRoom}
                className="btn btn-success btn-lg btn-block"
              >
                JOIN
              </button>

              <p className="mt-3 text-light">
                Don't have a room ID? create{" "}
                <span
                  onClick={generateRoomId}
                  className=" text-success p-2"
                  style={{ cursor: "pointer" }}
                >
                  New Room
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
