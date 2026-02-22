[🏠 Home](../../../README.md) | [⬅️ Tic-Tac-Toe](./09-tic-tac-toe.md) | [➡️ Interview Q&A](../05-interview-qa.md)

# 🐍🪜 Snake & Ladder Game Design

> Classic board game with snakes and ladders

---

## 💻 Implementation

```java
public class Player {
    private final String name;
    private int position;

    public Player(String name) {
        this.name = name;
        this.position = 0;
    }

    public void move(int steps) {
        this.position += steps;
    }

    public void setPosition(int pos) {
        this.position = pos;
    }

    public String getName() { return name; }
    public int getPosition() { return position; }
}

public class Board {
    private final int size;
    private final Map<Integer, Integer> snakes;   // head -> tail
    private final Map<Integer, Integer> ladders;  // bottom -> top

    public Board(int size) {
        this.size = size;
        this.snakes = new HashMap<>();
        this.ladders = new HashMap<>();
    }

    public void addSnake(int head, int tail) {
        if (head <= tail) throw new IllegalArgumentException("Invalid snake");
        snakes.put(head, tail);
    }

    public void addLadder(int bottom, int top) {
        if (bottom >= top) throw new IllegalArgumentException("Invalid ladder");
        ladders.put(bottom, top);
    }

    public int getNewPosition(int position) {
        if (snakes.containsKey(position)) {
            System.out.println("🐍 Oops! Snake bite!");
            return snakes.get(position);
        }
        if (ladders.containsKey(position)) {
            System.out.println("🪜 Yay! Climbed a ladder!");
            return ladders.get(position);
        }
        return position;
    }

    public int getSize() { return size; }
}

public class Dice {
    private final Random random = new Random();
    private final int faces;

    public Dice(int faces) {
        this.faces = faces;
    }

    public int roll() {
        return random.nextInt(faces) + 1;
    }
}

public class SnakeLadderGame {
    private final Board board;
    private final Dice dice;
    private final List<Player> players;
    private int currentPlayerIndex;
    private boolean gameOver;

    public SnakeLadderGame(int boardSize, List<String> playerNames) {
        this.board = new Board(boardSize);
        this.dice = new Dice(6);
        this.players = playerNames.stream()
                .map(Player::new)
                .collect(Collectors.toList());
        this.currentPlayerIndex = 0;
        this.gameOver = false;

        // Setup snakes and ladders
        board.addSnake(99, 54);
        board.addSnake(70, 55);
        board.addSnake(52, 42);
        board.addSnake(25, 2);
        board.addLadder(6, 25);
        board.addLadder(11, 40);
        board.addLadder(60, 85);
        board.addLadder(46, 90);
    }

    public void playTurn() {
        if (gameOver) {
            System.out.println("Game is over!");
            return;
        }

        Player current = players.get(currentPlayerIndex);
        int roll = dice.roll();
        System.out.printf("%s rolled %d%n", current.getName(), roll);

        int newPos = current.getPosition() + roll;

        if (newPos > board.getSize()) {
            System.out.println("Need exact roll to win. Stay at " + current.getPosition());
        } else {
            newPos = board.getNewPosition(newPos);
            current.setPosition(newPos);
            System.out.printf("%s moved to %d%n", current.getName(), newPos);

            if (newPos == board.getSize()) {
                System.out.println("🎉 " + current.getName() + " WINS!");
                gameOver = true;
                return;
            }
        }

        currentPlayerIndex = (currentPlayerIndex + 1) % players.size();
    }

    public void displayPositions() {
        System.out.println("\n=== Positions ===");
        for (Player p : players) {
            System.out.println(p.getName() + ": " + p.getPosition());
        }
    }
}
```

---

## 🧪 Usage

```java
SnakeLadderGame game = new SnakeLadderGame(100, List.of("Alice", "Bob"));

while (!game.isGameOver()) {
    game.playTurn();
    game.displayPositions();
    Thread.sleep(500);
}
```

---

*Next: [Interview Q&A →](../05-interview-qa.md)*
