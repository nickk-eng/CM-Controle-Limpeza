CREATE TABLE
    IF NOT EXISTS tarefas (
        id text PRIMARY KEY,
        nome varchar(120) NOT NULL,
        responsavel varchar(80) NOT NULL,
        setor varchar(80) NOT NULL,
        data date NOT NULL,
        horario time NOT NULL,
        concluida boolean NOT NULL DEFAULT false,
        concluida_em timestamptz
    );

CREATE INDEX IF NOT EXISTS tarefas_data_idx ON tarefas (data);