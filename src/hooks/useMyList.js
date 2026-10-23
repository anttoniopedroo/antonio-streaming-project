import { useCallback, useEffect, useState } from 'react';

// Uma lista por conta: quem entra depois no mesmo navegador não vê a lista de outra pessoa.
const storageKey = (owner) => `asp:my-list:${(owner ?? 'anonimo').toLowerCase()}`;

// Remove a lista global das versões antigas (V1.1), que era compartilhada entre contas.
try {
  localStorage.removeItem('asp:my-list');
} catch {
  // armazenamento indisponível
}

function readStored(owner) {
  try {
    const raw = localStorage.getItem(storageKey(owner));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// "Minha Lista" salva no navegador. Troque por chamadas à API quando houver API.
export function useMyList(owner) {
  const [ids, setIds] = useState(() => readStored(owner));

  // Troca de conta sem recarregar a página: carrega a lista da nova conta.
  useEffect(() => {
    setIds(readStored(owner));
  }, [owner]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(owner), JSON.stringify(ids));
    } catch {
      // armazenamento indisponível (aba anônima etc.): a lista vale só para a sessão
    }
  }, [owner, ids]);

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
