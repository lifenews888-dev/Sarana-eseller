import { redirect } from 'next/navigation';

// Хуурамч (демо) дэлгүүрийн чат байсан — бодит чатууд /messages дээр байна.
export default function ShopChatPage() {
  redirect('/messages');
}
