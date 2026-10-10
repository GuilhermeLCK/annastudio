import { useEffect, useState } from 'react';
import { estudioCarregado, estudioDaApi } from './estudio.js';

// Dados do estúdio do painel (contato, redes sociais, endereço, CNPJ e taxa). null enquanto carregam: quem usa não
// mostra o trecho até chegar, para nada aparecer e depois sumir.
export function useEstudio() {
  const [estudio, setEstudio] = useState(estudioCarregado);

  useEffect(() => {
    let ativo = true;
    estudioDaApi().then((dados) => {
      if (ativo) setEstudio(dados);
    });
    return () => {
      ativo = false;
    };
  }, []);

  return estudio;
}
