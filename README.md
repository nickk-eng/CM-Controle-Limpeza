
## Login dos funcionários

O site agora tem uma tela de login em /login e botão Sair. Configure no arquivo .env (local) ou nas variáveis Environment do Render:

```
APP_USERNAME=funcionarios
APP_PASSWORD=sua-senha-compartilhada
```

APP_USERNAME é o usuário fixo da equipe (padrão: funcionarios). APP_PASSWORD é a senha fixa escolhida pelo restaurante. Essas credenciais são verificadas no servidor. Reinicie o serviço depois de alterá-las. Não publique .env no GitHub.

O login tem validade de 8 horas e o botão Sair encerra a sessão. As sessões ficam na memória do servidor; reiniciar o serviço exige novo login. Use uma única instância do serviço para esse modelo de sessão. Dez tentativas incorretas do mesmo endereço bloqueiam novas tentativas por 15 minutos.

A orientação anterior sobre informar qualquer nome de usuário foi substituída: agora é necessário informar exatamente APP_USERNAME e APP_PASSWORD na tela do site.
