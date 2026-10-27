"use strict";
const $ = (id) => document.getElementById(id);
const hoje = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
}).format(new Date());
$("dia").value = $("data").value = hoje;
let tarefas = [],
  editando = null;
function mensagem(t) {
  $("mensagem").textContent = t;
}
async function api(url, options) {
  const r = await fetch(url, options);
  if (r.status === 401) { window.location.replace("/login"); throw new Error("Entre novamente para continuar."); }
  if (!r.ok)
    throw new Error(
      "Não foi possível salvar ou carregar os dados. Verifique a conexão e tente novamente.",
    );
  return r.status === 204 ? null : r.json();
}
async function carregar() {
  try {
    tarefas = await api(
      "/api/tarefas?data=" + encodeURIComponent($("dia").value),
    );
    render();
    mensagem("");
  } catch (e) {
    mensagem(e.message);
  }
}
function celula(tr, texto) {
  const td = document.createElement("td");
  td.textContent = texto;
  tr.append(td);
  return td;
}
function render() {
  const feitas = tarefas.filter((t) => t.concluida).length,
    pct = tarefas.length ? Math.round((feitas / tarefas.length) * 100) : 0;
  $("total").textContent = tarefas.length;
  $("concluidas").textContent = feitas;
  $("pendentes").textContent = tarefas.length - feitas;
  $("percentual").textContent = pct + "%";
  $("progresso").value = pct;
  $("progresso-texto").textContent = tarefas.length
    ? `${feitas} de ${tarefas.length} tarefas concluídas.`
    : "Nenhuma tarefa para este dia.";
  const busca = $("busca").value.toLocaleLowerCase("pt-BR");
  const lista = tarefas.filter(
    (t) =>
      [t.nome, t.responsavel, t.setor]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(busca) &&
      ($("filtro").value === "todas" ||
        t.concluida === ($("filtro").value === "concluidas")),
  );
  $("lista").replaceChildren();
  $("vazio").hidden = lista.length > 0;
  for (const t of lista) {
    const tr = document.createElement("tr"),
      check = document.createElement("input");
    check.type = "checkbox";
    check.checked = t.concluida;
    check.setAttribute("aria-label", "Concluir " + t.nome);
    celula(tr, "").append(check);
    check.onchange = async () => {
      check.disabled = true;
      try {
        await api("/api/tarefas/" + t.id + "/conclusao", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concluida: check.checked }),
        });
        await carregar();
      } catch (e) {
        check.checked = t.concluida;
        mensagem(e.message);
      } finally {
        check.disabled = false;
      }
    };
    const nome = celula(tr, t.nome),
      small = document.createElement("small");
    small.textContent = t.setor;
    nome.append(small);
    celula(tr, t.responsavel);
    celula(tr, t.horario);
    const status = celula(tr, t.concluida ? "Concluída" : "Pendente");
    if (t.concluida_em) {
      const s = document.createElement("small");
      s.textContent = new Date(t.concluida_em).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      status.append(s);
    }
    const a = celula(tr, "");
    for (const [label, fn] of [
      [
        "Editar",
        () => {
          editando = t.id;
          for (const k of ["nome", "responsavel", "setor", "data", "horario"])
            $(k).value = t[k];
          $("titulo-formulario").textContent = "Editar tarefa";
          $("salvar").textContent = "Salvar alterações";
          $("cancelar").hidden = false;
          $("nome").focus();
        },
      ],
      [
        "Excluir",
        async () => {
          if (!confirm("Excluir a tarefa “" + t.nome + "”?")) return;
          try {
            await api("/api/tarefas/" + t.id, { method: "DELETE" });
            if (editando === t.id) limpar();
            await carregar();
          } catch (e) {
            mensagem(e.message);
          }
        },
      ],
    ]) {
      const b = document.createElement("button");
      b.textContent = label;
      b.className = "secundario";
      b.onclick = fn;
      a.append(b);
    }
    $("lista").append(tr);
  }
}
function limpar() {
  editando = null;
  $("formulario").reset();
  $("data").value = $("dia").value;
  $("cancelar").hidden = true;
  $("titulo-formulario").textContent = $("salvar").textContent =
    "Cadastrar tarefa";
}
$("formulario").onsubmit = async (e) => {
  e.preventDefault();
  const dados = {};
  for (const k of ["nome", "responsavel", "setor", "data", "horario"])
    dados[k] = $(k).value.trim();
  $("salvar").disabled = true;
  try {
    await api("/api/tarefas/" + (editando || crypto.randomUUID()), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    $("dia").value = dados.data;
    limpar();
    await carregar();
    mensagem("Tarefa salva.");
  } catch (err) {
    mensagem(err.message);
  } finally {
    $("salvar").disabled = false;
  }
};
$("cancelar").onclick = limpar;
$("dia").onchange = () => {
  if (!$("dia").value) return;
  limpar();
  carregar();
};
$("busca").oninput = render;
$("filtro").onchange = render;
$("exportar").onclick = () => {
  const rows = [
    [
      "Tarefa",
      "Responsável",
      "Setor",
      "Data",
      "Horário",
      "Concluída",
      "Conclusão",
    ],
    ...tarefas.map((t) => [
      t.nome,
      t.responsavel,
      t.setor,
      t.data,
      t.horario,
      t.concluida ? "Sim" : "Não",
      t.concluida_em || "",
    ]),
  ];
  const csv = rows
    .map((r) =>
      r
        .map(
          (v) =>
            '"' +
            String(v)
              .replace(/^[=+@-]/, "'$&")
              .replaceAll('"', '""') +
            '"',
        )
        .join(";"),
    )
    .join("\r\n");
  const u = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    ),
    a = document.createElement("a");
  a.href = u;
  a.download = "limpeza-" + $("dia").value + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
carregar();

document.getElementById("sair").onclick = async () => { try { await api("/api/logout", {method:"POST"}); window.location.replace("/login"); } catch(e) { mensagem(e.message); } };
