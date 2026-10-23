import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'asp:my-list';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// "Minha Lista" salva no navegador. Troque por chamadas à API quando houver login.
export function useMyList() {
  const [ids, setIds] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // armazenamento indisponível (aba anônima etc.): a lista vale só para a sessão
    }
  }, [ids]);

  const has = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id) => {
      const willAdd = !ids.includes(id);
      setIds((prev) => (willAdd ? [id, ...prev] : prev.filter((x) => x !== id)));
      return willAdd;
    },
    [ids]
  );

  return { ids, has, toggle };
}
