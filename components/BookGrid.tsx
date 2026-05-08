import BookCard from "./BookCard";
import type { Book } from "@/lib/books";

export default function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="book-grid">
      {books.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  );
}
