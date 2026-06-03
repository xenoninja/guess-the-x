# Guess The X

Guess The X is a family of deduction games where the player identifies a hidden subject from structured clues. The first game focuses on football players.

## Language

**Guessable Player**:
A football player that can be selected as a guess during a game. Guessable players may include players who are too obscure to be chosen as the hidden answer.
_Avoid_: Search result, autocomplete option

**Answer Candidate**:
A football player eligible to be chosen as the hidden answer. Answer candidates are a curated subset of guessable players.
_Avoid_: Target pool, answer pool

**Big Five European Leagues**:
The five European domestic leagues used as the first football answer scope: Premier League, LaLiga, Serie A, Bundesliga, and Ligue 1.
_Avoid_: Top five leagues, biggest five leagues

**Guess The Football Player**:
The first Guess The X game, focused on identifying a hidden football player.
_Avoid_: Football mode, football page

**Daily Puzzle**:
A game instance where all players receive the same hidden answer for a calendar day.
_Avoid_: Random game, session puzzle

**Puzzle Date**:
The UTC calendar date that identifies a Daily Puzzle.
_Avoid_: Local day, user day

**Puzzle Age**:
A football player's age calculated on the Puzzle Date.
_Avoid_: Current age, local age

**Puzzle Progress**:
The guesses and outcome recorded for a player's attempt at a Daily Puzzle.
_Avoid_: Save data, local state

**Clue**:
A subject attribute revealed for each guess and compared against the hidden answer.
_Avoid_: Column, field

**Comparison Level**:
A related attribute used to grade a Clue without being shown as its own Clue. For football players, continent grades the nation Clue and league grades the club Clue.
_Avoid_: Hidden clue, helper field
