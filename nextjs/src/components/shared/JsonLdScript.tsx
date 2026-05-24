'use client';

import { useEffect } from 'react';

interface JsonLdScriptProps {
  id: string;
  data: Record<string, unknown>;
}

export default function JsonLdScript({ id, data }: JsonLdScriptProps) {
  useEffect(() => {
    let script = document.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);

    return () => {
      script?.remove();
    };
  }, [data, id]);

  return <template data-json-ld={id} />;
}
