// /src/app/page
import PaymentForm from "@/components/PaymentForm";
import { Suspense } from 'react';
 
export default function Home() {
  return (
    <section className="bg-gray-100 max-w-400 h-screen flex justify-center items-center">
      <Suspense fallback={<div>Loading...</div>}>
      <PaymentForm />
      </Suspense>
    </section>
  );
}