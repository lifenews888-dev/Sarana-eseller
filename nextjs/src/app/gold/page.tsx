import { redirect } from 'next/navigation';

// Gold гишүүнчлэл (төлбөр, хөнгөлөлт) хараахан хэрэгжээгүй тул хуудсыг түр хаасан.
export default function GoldPage() {
  redirect('/');
}
