package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

func ReturnGameState(w http.ResponseWriter, r *http.Request) {
	log.Printf("API  :: %s %s", r.Method, r.URL)

	// get game id from request
	gameId := r.URL.Query().Get("id")
	if gameId == "" {
		// TODO: return something useful
		http.Error(w, http.StatusText(400), 400)
		log.Printf("Game ID not requested")
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

	game, ok := games[gameId]
	if !ok {
		// TODO: return something useful
		http.Error(w, http.StatusText(422), 422)
		log.Printf("Requested game was not found.")
		return
	}

	if requestedRound == -1 {
		requestedRound = len(game.Rounds) - 1
	}

	// check requested round exists
	if requestedRound >= len(game.Rounds) {
		// TODO: return something useful
		http.Error(w, http.StatusText(422), 422)
		log.Printf("Requested round was not found.")
		return
	}

	response, err := json.Marshal(game.Rounds[requestedRound])
	if err != nil {
		log.Printf("Error marshalling game state %s", err)
	}
	fmt.Fprintf(w, string(response))
}
