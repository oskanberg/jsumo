package main

import (
	"log"
	"net/http"
)

type Vector struct {
	X, Y float64
}

type Ball struct {
	Location Vector
	Radius   float64
}

type MoveUpdate struct {
	Player string
	Move   Vector
}

type GameState struct {
	Balls map[string]Ball
	Moves map[string]Vector
}

type Game struct {
	Rounds  []GameState
	Players []string
}

var games map[string]Game = make(map[string]Game)

func apiHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		ReturnGameState(w, r)
	case "POST":
		UpdateMoves(w, r)
	case "PATCH":
		UpdateGameState(w, r)
	default:
		log.Printf("Unsupported method used, %s", r.Method)
	}
}

func NewGame() Game {
	// arbitrary first round
	firstRound := GameState{
		Balls: map[string]Ball{
			"johnson": Ball{
				Location: Vector{
					X: 100,
					Y: 100,
				},
				Radius: 15,
			},
		},
		Moves: make(map[string]Vector),
	}

	newGame := Game{
		Rounds:  []GameState{firstRound},
		Players: []string{"johnson"},
	}

	return newGame
}

func main() {
	games["first"] = NewGame()
	http.Handle("/", http.FileServer(http.Dir("./public/")))
	http.HandleFunc("/api/v1/GameState", apiHandler)
	http.HandleFunc("/api/v1/GameState", apiHandler)
	http.ListenAndServe(":3000", nil)
}
