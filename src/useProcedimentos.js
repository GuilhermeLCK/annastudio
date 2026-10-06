import { useCallback, useEffect, useState } from 'react';
import { procedimentosDaApi } from './procedimentos.js';

// Procedimentos ativos do painel (valor, tempo e destaque), só da API — nunca uma lista fixa.
// `estado`: 'carregando', 'pronto' ou 'erro'; `tentarDeNovo` busca outra vez depois de uma falha.
// Quem pede junto divide a mesma chamada (ver procedimentosDaApi).
export function useProcedimentos() {
  const [resultado, setResultado] = useState({ estado: 'carregando', lista: null });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    procedimentosDaApi()
      .then((lista) => {
        if (ativo) setResultado({ estado: 'pronto', lista });
      })
      .catch(() => {
        if (ativo) setResultado({ estado: 'erro', lista: null });
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const tentarDeNovo = useCallback(() => {
    setResultado({ estado: 'carregando', lista: null });
    setTentativa((n) => n + 1);
  }, []);

  return { ...resultado, tentarDeNovo };
}
