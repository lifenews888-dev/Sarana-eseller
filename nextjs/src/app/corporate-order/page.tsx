'use client';

import { useState } from 'react';
import { Building2, Truck, FileText, Loader2, CheckCircle } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CorporateOrderPage() {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [address, setAddress] = useState('');
  const [schedule, setSchedule] = useState('1'); // times per week
  const [invoiceRequest, setInvoiceRequest] = useState(true);
  const [payMethod, setPayMethod] = useState<'bank' | 'qpay'>('bank');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/corporate', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName, regNumber, department, address,
          deliverySchedule: `${schedule}x/week`,
          invoiceRequest, paymentMethod: payMethod, notes,
        }),
      });
      if (res.ok) setDone(true);
    } catch {}
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--esl-bg-section)]">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Хүсэлт илгээгдлээ!</h1>
          <p className="text-[var(--esl-text-secondary)]">Бид тантай 24 цагийн дотор холбогдоно.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-7 h-7 text-blue-900" />
          <div>
            <h1 className="text-2xl font-bold">Байгууллагын захиалга</h1>
            <p className="text-sm text-[var(--esl-text-secondary)]">B2B бөөний захиалга</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-blue-900' : 'bg-[var(--esl-bg-elevated)]'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold">Компанийн мэдээлэл</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Компанийн нэр</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Номин ХХК" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Регистрийн дугаар</label>
              <input value={regNumber} onChange={(e) => setRegNumber(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1234567" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Хэлтэс</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Худалдааны хэлтэс" />
            </div>
            <button onClick={() => setStep(2)} disabled={!companyName || !regNumber}
              className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50">Дараах</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Truck className="w-5 h-5" /> Хүргэлтийн мэдээлэл</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Хүлээн авах хаяг</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Улаанбаатар, СБД, 1-р хороо..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Хүргэлтийн хуваарь (7 хоногт)</label>
              <select value={schedule} onChange={(e) => setSchedule(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="1">7 хоногт 1 удаа</option>
                <option value="2">7 хоногт 2 удаа</option>
                <option value="3">7 хоногт 3 удаа</option>
                <option value="5">Ажлын өдөр бүр</option>
                <option value="7">Өдөр бүр</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 border py-3 rounded-xl text-sm font-medium">Өмнөх</button>
              <button onClick={() => setStep(3)} disabled={!address}
                className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50">Дараах</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[var(--esl-bg-card)] rounded-xl border p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><FileText className="w-5 h-5" /> Төлбөрийн мэдээлэл</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Төлбөрийн арга</label>
              <div className="flex gap-3">
                {[{ val: 'bank' as const, label: 'Банкны шилжүүлэг' }, { val: 'qpay' as const, label: 'QPay' }].map((m) => (
                  <button key={m.val} onClick={() => setPayMethod(m.val)}
                    className={`flex-1 border rounded-lg py-3 text-sm font-medium transition ${payMethod === m.val ? 'border-blue-900 bg-blue-50 text-blue-900' : ''}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={invoiceRequest} onChange={(e) => setInvoiceRequest(e.target.checked)} />
              Нэхэмжлэл гаргах
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Нэмэлт тэмдэглэл</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            </div>

            {/* Summary */}
            <div className="bg-[var(--esl-bg-section)] rounded-lg p-4 text-sm space-y-1">
              <p><span className="text-[var(--esl-text-secondary)]">Компани:</span> {companyName}</p>
              <p><span className="text-[var(--esl-text-secondary)]">Регистр:</span> {regNumber}</p>
              <p><span className="text-[var(--esl-text-secondary)]">Хаяг:</span> {address}</p>
              <p><span className="text-[var(--esl-text-secondary)]">Хуваарь:</span> 7 хоногт {schedule} удаа</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 border py-3 rounded-xl text-sm font-medium">Өмнөх</button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 bg-blue-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Хүсэлт илгээх
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
