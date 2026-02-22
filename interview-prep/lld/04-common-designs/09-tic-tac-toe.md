[🏠 Home](../../../README.md) | [⬅️ ATM Machine](./08-atm-machine.md) | [➡️ Snake & Ladder](./10-snake-ladder.md)

# ⭕ Tic-Tac-Toe Design

> Simple 3x3 grid game for two players

---

## 💻 Implementation

```java
public enum Symbol {
    X('X'), O('O'), EMPTY('.');
    private final char display;
    Symbol(char c) { this.display = c; }
    public char getDisplay() { return display; }
}

public class Player {
    private final String name;
    private final Symbol symbol;

    public Player(String name, Symbol symbol) {
        this.name = name;
        this.symbol = symbol;
    }
    // Getters...
}

public class Board {
    private final Symbol[][] grid;
    private final int size;

    public Board(int size) {
        this.size = size;
        this.grid = new Symbol[size][size];
        for (int i = 0; i < size; i++) {
            Arrays.fill(grid[i], Symbol.EMPTY);
        }
    }

    public boolean place(int row, int col, Symbol symbol) {
        if (row < 0 || row >= size || col < 0 || col >= size) return false;
        if (grid[row][col] != Symbol.EMPTY) return false;
        grid[row][col] = symbol;
        return true;
    }

    public boolean checkWin(Symbol symbol) {
        // Check rows and columns
        for (int i = 0; i < size; i++) {
            if (checkLine(grid[i][0], grid[i][1], grid[i][2], symbol)) return true;
            if (checkLine(grid[0][i], grid[1][i], grid[2][i], symbol)) return true;
        }
        // Check diagonals
        if (checkLine(grid[0][0], grid[1][1], grid[2][2], symbol)) return true;
        if (checkLine(grid[0][2], grid[1][1], grid[2][0], symbol)) return true;
        return false;
    }

    private boolean checkLine(Symbol a, Symbol b, Symbol c, Symbol target) {
        return a == target && b == target && c == target;
    }

    public boolean isFull() {
        for (Symbol[] row : grid) {
            for (Symbol cell : row) {
                if (cell == Symbol.EMPTY) return false;
            }
        }
        return true;
    }

    public void display() {
        System.out.println("\n  0 1 2");
        for (int i = 0; i < size; i++) {
            System.out.print(i + " ");
            for (int j = 0; j < size; j++) {
                System.out.print(grid[i][j].getDisplay() + " ");
            }
            System.out.println();
        }
    }
}

public class TicTacToe {
    private final Board board;
    private final Player player1;
    private final Player player2;
    private Player currentPlayer;
    private boolean gameOver;

    public TicTacToe(String p1Name, String p2Name) {
        this.board = new Board(3);
        this.player1 = new Player(p1Name, Symbol.X);
        this.player2 = new Player(p2Name, Symbol.O);
        this.currentPlayer = player1;
        this.gameOver = false;
    }

    public boolean play(int row, int col) {
        if (gameOver) {
            System.out.println("Game is over!");
            return false;
        }

        if (!board.place(row, col, currentPlayer.getSymbol())) {
            System.out.println("Invalid move!");
            return false;
        }

        board.display();

        if (board.checkWin(currentPlayer.getSymbol())) {
            System.out.println("🎉 " + currentPlayer.getName() + " wins!");
            gameOver = true;
            return true;
        }

        if (board.isFull()) {
            System.out.println("It's a draw!");
            gameOver = true;
            return true;
        }

        currentPlayer = (currentPlayer == player1) ? player2 : player1;
        System.out.println(currentPlayer.getName() + "'s turn (" + currentPlayer.getSymbol() + ")");
        return true;
    }
}
```

---

## 🧪 Usage

```java
TicTacToe game = new TicTacToe("Alice", "Bob");
game.play(1, 1);  // Alice: center
game.play(0, 0);  // Bob: top-left
game.play(0, 1);  // Alice
game.play(2, 1);  // Bob
game.play(2, 1);  // Alice wins diagonally
```

---

*Next: [Snake & Ladder →](./10-snake-ladder.md)*
