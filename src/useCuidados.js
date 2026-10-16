import { useEffect, useState } from 'react';
import { buscarCuidados } from './api.js';

let atual = null; // a lista que já chegou ([] se a API falhou ou ainda não tem a rota)
let promessa = null;

// Busca uma vez e divide a mesma chamada entre quem pedir junto.
function cuidadosDaApi() {
  if (!promessa) {
    promessa = buscarCuidados()
      .then((lista) => (Array.isArray(lista) ? lista : []))
      .catch(() => [])
      .then((lista) => {
        atual = lista.filter((c) => (c?.titulo ?? '').trim() !== '');
        return atual;
      });
  }
  return promessa;
}

// Cuidados pós-atendimento cadastrados no painel, na ordem de lá. null enquanto carregam; vazio = nenhum cadastrado
// (ou servidor sem a rota): quem usa não mostra a seção.
export function useCuidados() {
  const [cuidados, setCuidados] = useState(atual);

  useEffect(() => {
    let ativo = true;
    cuidadosDaApi().then((lista) => {
      if (ativo) setCuidados(lista);
    });
    return () => {
      ativo = false;
    };
  }, []);

  return cuidados;
}
