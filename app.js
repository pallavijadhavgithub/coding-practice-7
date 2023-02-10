const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();

module.exports = app;

filePath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
app.use(express.json());

const convertPlayerDetailsCamelcase = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsCamelcase = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const initializerDbAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`Error : ${e.message}`);
  }
};
initializerDbAndServer();

//GET API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT *
        FROM player_details;`;

  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerDetailsCamelcase(eachPlayer))
  );
});

//GET API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id = ${playerId}`;

  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsCamelcase(player));
});

//PUT API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayersDetQuery = `
        UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
        WHERE player_id = ${playerId};`;

  await db.run(updatePlayersDetQuery);
  response.send("Player Details Updated");
});

//GET API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesDetailsQuery = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};`;
  const matchesArray = await db.get(getMatchesDetailsQuery);
  response.send(convertMatchDetailsCamelcase(matchesArray));
});

//GET API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT *
        FROM player_match_score NATURAL JOIN match_details
        WHERE player_id = ${playerId};`;

  const match = await db.all(getMatchesQuery);
  response.send(
    match.map((eachMatch) => convertMatchDetailsCamelcase(eachMatch))
  );
});

//get API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT * 
        FROM player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId};`;
  const playersArr = await db.all(getMatchQuery);
  response.send(
    playersArr.map((eachPlayer) => convertPlayerDetailsCamelcase(eachPlayer))
  );
});

//get API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsQuery = `
        SELECT 
            player_details.player_id AS playerId,
            player_details.player_name AS playerName,
            SUM(Player_match_score.score) AS totalScore,
            SUM(Player_match_score.fours) AS totalFours,
            SUM(player_match_score.sixes) AS totalSixes
        FROM 
            player_details INNER JOIN player_match_score ON 
            player_details.player_id = player_match_score.player_id 
        WHERE 
            player_details.player_id = ${playerId};`;
  const playerDetailsArr = await db.get(playerDetailsQuery);
  response.send(playerDetailsArr);
});
