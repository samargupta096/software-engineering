[🏠 Home](../../../README.md) | [⬅️ Library Management](./07-library-management.md) | [➡️ Tic-Tac-Toe](./09-tic-tac-toe.md)

# 🏧 ATM Machine Design

> Design an ATM system with multiple transaction types

---

## 📋 Requirements

1. Card authentication with PIN
2. Check balance
3. Withdraw cash (with denomination selection)
4. Deposit money
5. Handle insufficient funds and daily limits

---

## 💻 Implementation

### Core Classes

```java
public enum TransactionType {
    BALANCE_INQUIRY, WITHDRAWAL, DEPOSIT, TRANSFER
}

public class Card {
    private final String cardNumber;
    private final String pin;
    private final Account account;
    private boolean blocked;

    public Card(String cardNumber, String pin, Account account) {
        this.cardNumber = cardNumber;
        this.pin = pin;
        this.account = account;
        this.blocked = false;
    }

    public boolean validatePin(String enteredPin) {
        return !blocked && pin.equals(enteredPin);
    }
    // Getters...
}

public class Account {
    private final String accountNumber;
    private double balance;
    private final double dailyWithdrawalLimit;
    private double withdrawnToday;

    public Account(String accountNumber, double balance) {
        this.accountNumber = accountNumber;
        this.balance = balance;
        this.dailyWithdrawalLimit = 50000;
        this.withdrawnToday = 0;
    }

    public synchronized boolean withdraw(double amount) {
        if (amount > balance) {
            throw new IllegalStateException("Insufficient balance");
        }
        if (withdrawnToday + amount > dailyWithdrawalLimit) {
            throw new IllegalStateException("Daily limit exceeded");
        }
        balance -= amount;
        withdrawnToday += amount;
        return true;
    }

    public synchronized void deposit(double amount) {
        balance += amount;
    }

    public double getBalance() { return balance; }
}
```

### ATM with State Pattern

```java
public interface ATMState {
    void insertCard(ATM atm, Card card);
    void enterPin(ATM atm, String pin);
    void selectTransaction(ATM atm, TransactionType type);
    void executeTransaction(ATM atm, double amount);
    void ejectCard(ATM atm);
}

public class IdleState implements ATMState {
    @Override
    public void insertCard(ATM atm, Card card) {
        System.out.println("Card inserted");
        atm.setCurrentCard(card);
        atm.setState(new HasCardState());
    }
    // Other methods throw "Insert card first"
}

public class HasCardState implements ATMState {
    private int attempts = 0;

    @Override
    public void enterPin(ATM atm, String pin) {
        if (atm.getCurrentCard().validatePin(pin)) {
            System.out.println("PIN verified");
            atm.setState(new AuthenticatedState());
        } else {
            attempts++;
            if (attempts >= 3) {
                System.out.println("Card blocked");
                atm.getCurrentCard().block();
                atm.ejectCard();
            } else {
                System.out.println("Wrong PIN. Attempts: " + attempts);
            }
        }
    }
    // Other methods...
}

public class AuthenticatedState implements ATMState {
    @Override
    public void selectTransaction(ATM atm, TransactionType type) {
        atm.setTransactionType(type);
        atm.setState(new TransactionState());
    }
}

public class ATM {
    private ATMState state;
    private Card currentCard;
    private TransactionType transactionType;
    private Map<Integer, Integer> cashInventory; // denomination -> count

    public ATM() {
        this.state = new IdleState();
        this.cashInventory = new HashMap<>();
        cashInventory.put(100, 100);
        cashInventory.put(500, 50);
        cashInventory.put(2000, 20);
    }

    public void withdraw(double amount) {
        if (!canDispense(amount)) {
            throw new IllegalStateException("Cannot dispense this amount");
        }
        currentCard.getAccount().withdraw(amount);
        dispense(amount);
    }

    private boolean canDispense(double amount) {
        // Check if we can make up the amount with available denominations
        return amount % 100 == 0 && getTotalCash() >= amount;
    }

    private void dispense(double amount) {
        // Greedy algorithm for cash dispensing
        int remaining = (int) amount;
        Map<Integer, Integer> dispensed = new LinkedHashMap<>();

        for (int denom : new int[]{2000, 500, 100}) {
            int count = Math.min(remaining / denom, cashInventory.get(denom));
            if (count > 0) {
                dispensed.put(denom, count);
                cashInventory.put(denom, cashInventory.get(denom) - count);
                remaining -= denom * count;
            }
        }

        System.out.println("Dispensing: " + dispensed);
    }

    // State delegations and getters/setters...
}
```

---

## 🧪 Usage

```java
ATM atm = new ATM();
Account account = new Account("ACC001", 50000);
Card card = new Card("1234-5678-9012-3456", "1234", account);

atm.insertCard(card);
atm.enterPin("1234");
atm.selectTransaction(TransactionType.WITHDRAWAL);
atm.withdraw(5000);
atm.ejectCard();
```

---

*Next: [Tic-Tac-Toe →](./09-tic-tac-toe.md)*
