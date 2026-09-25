import BookCard from "./BookCard";
import type { BookSummary } from "@/lib/books";

export default function BookGrid({ books, priorityCount = 0 }: { books: BookSummary[]; priorityCount?: number }) {
  return (
    <div className="book-grid">
      {books.map((b, i) => (
        <BookCard key={b.id} book={b} priority={i < priorityCount} />
      ))}
    </div>
  );
}
