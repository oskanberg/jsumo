package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

// simply overwrites the move if player has already made it
func UpdateMoves(w http.ResponseWriter, r *http.Request) {
	log.Printf("API  :: %s %s", r.Method, r.URL)

	// get game id from request
	gameId := r.URL.Query().Get("id")
	if gameId == "" {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Game ID not requested")
		return
	}

	// check game exists
	game, ok := games[gameId]
	if !ok {
		// TODO: return something useful
		http.Error(w, http.StatusText(422), 422)
		log.Printf("Requested game was not found.")
		return
	}

	// parse move update
	var move MoveUpdate
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&move)
	if err != nil {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Error unmarshalling move update: %s", err)
		return
	}

	// check player is defined
	if move.Player == "" {
		http.Error(w, http.StatusText(422), 422)
		log.Printf("Error unmarshalling move update: %s", err)
		return
	}

	round := game.Rounds[len(game.Rounds)-1]
	// TODO: check validity of move?
	round.Moves[move.Player] = &move.Move
}

// just for now, so we don't have to simulate the game,
// take their word for it
func UpdateGameState(w http.ResponseWriter, r *http.Request) {
	log.Printf("API  :: %s %s", r.Method, r.URL)

	// get game id from request
	gameId := r.URL.Query().Get("id")
	if gameId == "" {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Game ID not requested")
		return
	}

	// check game exists
	game, ok := games[gameId]
	if !ok {
		// TODO: return something useful
		http.Error(w, http.StatusText(422), 422)
		log.Printf("Requested game was not found.")
		return
	}

	// get round from request
	requestedRoundStr := r.URL.Query().Get("round")
	if gameId == "" {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Round not requested.")
		return
	}

	// parse round
	requestedRound, err := strconv.Atoi(requestedRoundStr)
	if err != nil {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Converting round to int failed: %s", err)
		return
	}

	// parse state update
	var newState map[string]*Ball
	decoder := json.NewDecoder(r.Body)
	err = decoder.Decode(&newState)
	if err != nil {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Error unmarshalling state update: %s", err)
		return
	}

	// if this is the new (uncreated) round, create it
	// TODO: fix security
	if requestedRound == len(game.Rounds) {
		fmt.Println("creating new round")
		game.Rounds = append(game.Rounds, GameState{
			Balls: newState,
			Moves: make(map[string]*Vector),
			Round: requestedRound,
		})
	}

	// otherwise, don't do anything (for now)
	// TODO

}
