import { useEffect, useState } from 'react';
import { procedimentosDaApi } from './procedimentos.js';

// Procedimentos ativos do painel (valor, tempo e destaque). `null` enquanto não chegam ou se a API falhar,
// para a página mostrar o que é fixo em data.js. Quem pede junto divide a mesma chamada (ver procedimentosDaApi).
export function useProcedimentos() {
  const [procedimentos, setProcedimentos] = useState(null);

  useEffect(() => {
    let ativo = true;
    procedimentosDaApi()
      .then((lista) => {
        if (ativo && lista.length > 0) setProcedimentos(lista);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  return procedimentos;
}
