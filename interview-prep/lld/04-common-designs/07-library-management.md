[🏠 Home](../../../README.md) | [⬅️ Expense Splitter](./06-expense-splitter.md) | [➡️ Tic-Tac-Toe](./09-tic-tac-toe.md)

# 📚 Library Management System

> Design a system to manage library operations

---

## 📋 Requirements

1. Add/remove books with multiple copies
2. Member registration and management
3. Issue and return books
4. Track due dates and calculate fines
5. Search books by title, author, ISBN

---

## 💻 Implementation

### Core Classes

```java
public enum BookStatus {
    AVAILABLE, ISSUED, RESERVED, LOST
}

public class Book {
    private final String isbn;
    private final String title;
    private final String author;
    private final String publisher;
    private final int totalCopies;
    private int availableCopies;

    public Book(String isbn, String title, String author, String publisher, int copies) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.totalCopies = copies;
        this.availableCopies = copies;
    }

    public synchronized boolean issue() {
        if (availableCopies > 0) {
            availableCopies--;
            return true;
        }
        return false;
    }

    public synchronized void returnBook() {
        if (availableCopies < totalCopies) {
            availableCopies++;
        }
    }

    public boolean isAvailable() { return availableCopies > 0; }
    // Getters...
}

public class Member {
    private final String id;
    private final String name;
    private final String email;
    private final List<BookLoan> activeLoans;
    private static final int MAX_BOOKS = 5;
    private static final int LOAN_DAYS = 14;

    public Member(String name, String email) {
        this.id = "M" + UUID.randomUUID().toString().substring(0, 6);
        this.name = name;
        this.email = email;
        this.activeLoans = new ArrayList<>();
    }

    public boolean canBorrow() {
        return activeLoans.size() < MAX_BOOKS;
    }

    public void addLoan(BookLoan loan) {
        activeLoans.add(loan);
    }

    public void removeLoan(BookLoan loan) {
        activeLoans.remove(loan);
    }
    // Getters...
}

public class BookLoan {
    private final String id;
    private final Book book;
    private final Member member;
    private final LocalDate issueDate;
    private final LocalDate dueDate;
    private LocalDate returnDate;
    private double fine;

    public BookLoan(Book book, Member member) {
        this.id = "L" + UUID.randomUUID().toString().substring(0, 6);
        this.book = book;
        this.member = member;
        this.issueDate = LocalDate.now();
        this.dueDate = issueDate.plusDays(14);
    }

    public double calculateFine() {
        if (returnDate == null) return 0;
        long overdueDays = ChronoUnit.DAYS.between(dueDate, returnDate);
        return overdueDays > 0 ? overdueDays * 5.0 : 0; // ₹5 per day
    }

    public void returnBook() {
        this.returnDate = LocalDate.now();
        this.fine = calculateFine();
    }
    // Getters...
}
```

### Library Service

```java
public class Library {
    private final Map<String, Book> books = new HashMap<>();
    private final Map<String, Member> members = new HashMap<>();
    private final Map<String, BookLoan> activeLoans = new HashMap<>();

    public void addBook(Book book) {
        books.put(book.getIsbn(), book);
        System.out.println("Added: " + book.getTitle());
    }

    public void registerMember(Member member) {
        members.put(member.getId(), member);
        System.out.println("Registered: " + member.getName());
    }

    public BookLoan issueBook(String memberId, String isbn) {
        Member member = members.get(memberId);
        Book book = books.get(isbn);

        if (member == null) throw new IllegalArgumentException("Member not found");
        if (book == null) throw new IllegalArgumentException("Book not found");
        if (!member.canBorrow()) throw new IllegalStateException("Member has max books");
        if (!book.isAvailable()) throw new IllegalStateException("Book not available");

        book.issue();
        BookLoan loan = new BookLoan(book, member);
        member.addLoan(loan);
        activeLoans.put(loan.getId(), loan);

        System.out.printf("Issued '%s' to %s. Due: %s%n", 
            book.getTitle(), member.getName(), loan.getDueDate());
        return loan;
    }

    public double returnBook(String loanId) {
        BookLoan loan = activeLoans.remove(loanId);
        if (loan == null) throw new IllegalArgumentException("Loan not found");

        loan.returnBook();
        loan.getBook().returnBook();
        loan.getMember().removeLoan(loan);

        double fine = loan.getFine();
        System.out.printf("Returned '%s'. Fine: ₹%.2f%n", 
            loan.getBook().getTitle(), fine);
        return fine;
    }

    public List<Book> searchByTitle(String title) {
        return books.values().stream()
            .filter(b -> b.getTitle().toLowerCase().contains(title.toLowerCase()))
            .collect(Collectors.toList());
    }

    public List<Book> searchByAuthor(String author) {
        return books.values().stream()
            .filter(b -> b.getAuthor().toLowerCase().contains(author.toLowerCase()))
            .collect(Collectors.toList());
    }
}
```

---

## 🧪 Usage

```java
Library library = new Library();

library.addBook(new Book("978-0134685991", "Effective Java", "Joshua Bloch", "Addison-Wesley", 3));
library.addBook(new Book("978-0596009205", "Head First Design Patterns", "Eric Freeman", "O'Reilly", 2));

Member member = new Member("Rahul", "rahul@email.com");
library.registerMember(member);

BookLoan loan = library.issueBook(member.getId(), "978-0134685991");
// ... after reading
library.returnBook(loan.getId());
```

---

*Next: [Tic-Tac-Toe →](./09-tic-tac-toe.md)*
