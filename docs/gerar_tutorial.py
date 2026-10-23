import os
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    Preformatted, KeepTogether, PageBreak, CondPageBreak,
)

# Gera docs/Tutorial_Chave_API.pdf. Uso: python docs/gerar_tutorial.py  (requer: pip install reportlab)
import json
_pkg = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "package.json"), encoding="utf-8"))
VERSAO = "V" + ".".join(_pkg["version"].split(".")[:2])
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Tutorial_Chave_API.pdf")

ACCENT = colors.HexColor("#e11d48")
ACCENT2 = colors.HexColor("#7c3aed")
INK = colors.HexColor("#1f2430")
MUTED = colors.HexColor("#5b6070")
LINE = colors.HexColor("#e3e5ea")
CODE_BG = colors.HexColor("#f4f5f8")
HEAD_BG = colors.HexColor("#14141c")
WARN_BG = colors.HexColor("#fff4e5")
WARN_BD = colors.HexColor("#f59e0b")
OK_BG = colors.HexColor("#ecfdf3")
OK_BD = colors.HexColor("#16a34a")
INFO_BG = colors.HexColor("#f1ecff")

W, H = A4
M = 18 * mm
CW = W - 2 * M

# ---------- estilos ----------
body = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14.5, textColor=INK, spaceAfter=6)
small = ParagraphStyle("small", parent=body, fontSize=8.8, leading=12, textColor=MUTED)
h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=INK, spaceBefore=6, spaceAfter=8, keepWithNext=1)
h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=ACCENT, spaceBefore=10, spaceAfter=5, keepWithNext=1)
cell = ParagraphStyle("cell", parent=body, fontSize=9, leading=12, spaceAfter=0)
cellb = ParagraphStyle("cellb", parent=cell, fontName="Helvetica-Bold")
cellh = ParagraphStyle("cellh", parent=cell, fontName="Helvetica-Bold", textColor=colors.white)
code_style = ParagraphStyle("code", fontName="Courier", fontSize=8.6, leading=11.4, textColor=INK)
bullet = ParagraphStyle("bullet", parent=body, leftIndent=14, bulletIndent=3, spaceAfter=3)


lead = ParagraphStyle("lead", parent=body, keepWithNext=1)


def P(text, style=body):
    return Paragraph(text, style)


def C(text):
    """Bloco de código com fundo cinza."""
    t = Table([[Preformatted(text.strip("\n"), code_style)]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CODE_BG),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return KeepTogether([t, Spacer(1, 7)])


def box(title, text, bg, border):
    content = [P(f"<b>{title}</b>", ParagraphStyle("bt", parent=cell, textColor=INK)),
               Spacer(1, 3), P(text, cell)]
    t = Table([[content]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3.5, border),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return KeepTogether([t, Spacer(1, 8)])


def table(header, rows, widths, code_cols=()):
    data = [[P(h, cellh) for h in header]]
    for r in rows:
        line = []
        for i, v in enumerate(r):
            if i in code_cols:
                line.append(P(f'<font face="Courier" size="8.6">{v}</font>', cell))
            else:
                line.append(P(v, cell))
        data.append(line)
    t = Table(data, colWidths=[CW * w for w in widths], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEAD_BG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafc")]),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return KeepTogether([t, Spacer(1, 9)])


def bullets(items):
    return [Paragraph(i, bullet, bulletText="•") for i in items]


def step(n, title):
    badge = Table([[P(f'<font color="white"><b>{n}</b></font>', ParagraphStyle("n", parent=cell, alignment=1, fontSize=10))]],
                  colWidths=[7 * mm], rowHeights=[7 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), ACCENT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    t = Table([[badge, P(f"<b>{title}</b>", ParagraphStyle("st", parent=body, fontSize=11.5, spaceAfter=0))]],
              colWidths=[10 * mm, CW - 10 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    t.keepWithNext = 1
    return t


# ---------- página ----------
def on_page(canvas, doc):
    canvas.saveState()
    # faixa superior em gradiente simples (duas cores)
    canvas.setFillColor(ACCENT)
    canvas.rect(0, H - 5 * mm, W / 2, 5 * mm, stroke=0, fill=1)
    canvas.setFillColor(ACCENT2)
    canvas.rect(W / 2, H - 5 * mm, W / 2, 5 * mm, stroke=0, fill=1)
    # rodapé
    canvas.setStrokeColor(LINE)
    canvas.line(M, 13 * mm, W - M, 13 * mm)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(M, 9 * mm, f"ANTONIO STREAMING PROJECT {VERSAO}")
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(M + canvas.stringWidth(f"ANTONIO STREAMING PROJECT {VERSAO}", "Helvetica-Bold", 7.5) + 4, 9 * mm, "·  Tutorial da chave da API")
    canvas.drawRightString(W - M, 9 * mm, f"Página {doc.page}")
    canvas.restoreState()


def cover_block():
    title = P('<font color="white" size="9"><b>ANTONIO STREAMING PROJECT ' + VERSAO + '</b></font>',
              ParagraphStyle("c0", parent=body, spaceAfter=4))
    big = P('<font color="white">Tutorial: conectando a sua API autorizada</font>',
            ParagraphStyle("c1", fontName="Helvetica-Bold", fontSize=21, leading=25, spaceAfter=6))
    sub = P('<font color="#c9c9d6">Onde colocar a chave, como a API deve responder e o que esperar depois de ligá-la ao projeto.</font>',
            ParagraphStyle("c2", parent=body, fontSize=10.5, leading=15, spaceAfter=0))
    t = Table([[[title, big, sub]]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HEAD_BG),
        ("LINEBELOW", (0, 0), (-1, -1), 3, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 16), ("RIGHTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 16), ("BOTTOMPADDING", (0, 0), (-1, -1), 16),
    ]))
    return t


def flow_diagram():
    cells = ["Navegador\n(site)", "Vite\nlocalhost:5173", "Back-end\nlocalhost:3001", "Sua API\nautorizada"]
    notes = ["chama /api/...", "repassa /api", "+ adiciona a chave", "responde JSON"]
    row1, row2 = [], []
    for i, c in enumerate(cells):
        row1.append(P(f"<b>{c.replace(chr(10), '<br/>')}</b>", ParagraphStyle("fd", parent=cell, alignment=1)))
        row2.append(P(notes[i], ParagraphStyle("fn", parent=small, alignment=1)))
        if i < len(cells) - 1:
            row1.append(P('<font size="14" color="#e11d48"><b>&gt;</b></font>', ParagraphStyle("ar", parent=cell, alignment=1)))
            row2.append("")
    bw = (CW - 3 * 9 * mm) / 4
    widths = [bw, 9 * mm] * 3 + [bw]
    t = Table([row1, row2], colWidths=widths)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for col in range(0, 7, 2):
        bg = INFO_BG if col == 4 else CODE_BG
        style += [("BACKGROUND", (col, 0), (col, 0), bg), ("BOX", (col, 0), (col, 0), 0.6, LINE)]
    style += [("BOX", (4, 0), (4, 0), 1.2, ACCENT2)]
    t.setStyle(TableStyle(style))
    return KeepTogether([t, Spacer(1, 8)])


# ---------- conteúdo ----------
s = []
s += [cover_block(), Spacer(1, 12)]

s += [P("Visão geral", h1),
      P("O site <b>nunca</b> fala diretamente com a sua API. Ele chama o back-end do projeto (<font face='Courier'>server/index.js</font>), "
        "que lê a chave de um arquivo que fica só no seu computador, anexa a chave à requisição e repassa a resposta para o site. "
        "Assim, a chave nunca aparece no navegador."),
      flow_diagram()]

s += [P("1. Onde fica cada arquivo", h1),
      P("Existem <b>dois</b> arquivos de configuração com papéis diferentes. A chave vai em apenas um deles.", lead),
      C(r"""
catalogo_projeto/
├── server/
│   ├── chave_api.env           <- A CHAVE ENTRA AQUI (API_KEY=)
│   ├── chave_api.env.example      modelo vazio (é o que vai para o GitHub)
│   ├── app.js                     back-end: rotas e caminhos da API
│   └── catalog.js                 proxy que anexa a chave
├── src/
│   └── services/api.js            chamadas do site ao back-end
├── .env.example
└── .env                        <- dados PÚBLICOS do Supabase; NÃO é para a chave
""".replace("├──", "|--").replace("└──", "`--").replace("│", "|")),
      P("<b>Caminho do arquivo da chave, a partir da pasta do projeto:</b>", lead),
      C(r"catalogo_projeto\server\chave_api.env"),
      table(["Arquivo", "O que vai nele", "Visível no navegador?"],
            [["server/chave_api.env", "URL da API (API_BASE_URL) e <b>a chave (API_KEY)</b>", '<font color="#16a34a"><b>Não</b></font>'],
             [".env (raiz do projeto)", "Só os dados públicos do Supabase (login). Nada da API.", '<font color="#e11d48"><b>Sim</b></font>']],
            [0.3, 0.48, 0.22], code_cols=(0,)),
      box("Atenção",
          "Tudo que começa com <font face='Courier'>VITE_</font> é embutido no código que o navegador baixa. "
          "Por isso a chave <b>jamais</b> deve ser colocada no <font face='Courier'>.env</font> da raiz.",
          WARN_BG, WARN_BD)]

s += [CondPageBreak(60 * mm), P("2. Passo a passo", h1)]

s += [step(1, "Abra (ou crie) o arquivo da chave"),
      P("No seu computador o arquivo já existe. Dentro da pasta do projeto, abra no Bloco de Notas:", lead),
      C(r"notepad server\chave_api.env"),
      P("Se você clonou o projeto do GitHub em outra máquina, o arquivo não vem junto. Crie a partir do modelo, na pasta do projeto:", lead),
      C(r"Copy-Item server\chave_api.env.example server\chave_api.env")]

s += [step(2, "Preencha a URL e a chave"),
      P("Cole os valores logo depois do <font face='Courier'>=</font>, <b>sem aspas e sem espaços</b>:", lead),
      C("""
API_BASE_URL=https://api.seuprovedor.com/v1

# >>> A CHAVE ENTRA AQUI <<<
API_KEY=sk_live_SUA_CHAVE_AQUI
"""),
      table(["Variável", "Para que serve", "Exemplo"],
            [["API_BASE_URL", "Endereço base da API, <b>sem barra no final</b>.", "https://api.ex.com/v1"],
             ["API_KEY", "Sua chave secreta.", "abc123..."],
             ["API_KEY_HEADER", "Nome do cabeçalho que leva a chave.", "Authorization"],
             ["API_KEY_PREFIX", "Texto antes da chave no cabeçalho (pode ficar vazio).", "Bearer"],
             ["API_KEY_QUERY_PARAM", "Se preenchido, a chave vai na URL e o cabeçalho é ignorado.", "api_key"],
             ["API_ALLOWED_PATHS", "Únicos caminhos da API que o site pode chamar. Protege a chave.", "/titles"],
             ["API_CACHE_SECONDS", "Tempo que as respostas ficam em cache (economiza cota).", "60"],
             ["PORT", "Porta do back-end local. Não altere sem necessidade.", "3001"]],
            [0.29, 0.45, 0.26], code_cols=(0, 2))]

s += [CondPageBreak(70 * mm), step(3, "Diga como a sua API recebe a chave"),
      P("Consulte a documentação do seu provedor e escolha a linha correspondente:", lead),
      table(["A documentação pede", "Configure assim", "O back-end envia"],
            [["Authorization: Bearer CHAVE", "API_KEY_HEADER=Authorization<br/>API_KEY_PREFIX=Bearer<br/>API_KEY_QUERY_PARAM=",
              "Authorization: Bearer abc123"],
             ["x-api-key: CHAVE", "API_KEY_HEADER=x-api-key<br/>API_KEY_PREFIX=<br/>API_KEY_QUERY_PARAM=",
              "x-api-key: abc123"],
             ["?api_key=CHAVE na URL", "API_KEY_QUERY_PARAM=api_key", "GET /titles?api_key=abc123"]],
            [0.28, 0.38, 0.34], code_cols=(0, 1, 2))]

s += [step(4, "Libere só os caminhos que o site usa"),
      P("O back-end só repassa para a sua API os caminhos listados em <font face='Courier'>API_ALLOWED_PATHS</font>. "
        "Qualquer outro caminho é recusado <b>antes</b> de chegar à API, então ninguém consegue usar a sua chave "
        "em endpoints de conta ou cobrança do provedor. O padrão já cobre os endpoints da seção 3:", lead),
      C("API_ALLOWED_PATHS=/titles"),
      P("Se a sua API usar outros caminhos, liste todos separados por vírgula (ex.: <font face='Courier'>/movies,/series</font>) "
        "e ajuste as rotas em <font face='Courier'>server/app.js</font> (seção 3.5).", small)]

s += [step(5, "Reinicie o projeto"),
      P("O back-end e o Vite só leem os arquivos de configuração quando iniciam. Pare o que estiver rodando (<b>Ctrl+C</b>) e execute:", lead),
      C("npm run dev:all"),
      P("Esse comando sobe o site (porta 5173) e o back-end (porta 3001) juntos. "
        "O login do Supabase precisa estar configurado (veja o README).", small)]

s += [CondPageBreak(90 * mm), P("3. Modelo da API (sintaxe esperada)", h1),
      P("O site faz chamadas <b>GET</b> e espera respostas em <b>JSON</b>. Ele nunca fala com a sua API: "
        "chama o back-end (<font face='Courier'>/api/catalog</font>, <font face='Courier'>/api/search</font>), que confere o login "
        "e então chama <font face='Courier'>API_BASE_URL</font> + o caminho abaixo, já com a chave.")]

s += [P("3.1 Endpoints", h2),
      table(["Método", "Caminho na sua API", "Deve retornar", "Usado em"],
            [["GET", "/titles", "Array de títulos", "Catálogo inteiro (o site chama /api/catalog)"],
             ["GET", "/titles/search?q=texto", "Array de títulos", "Busca do header (o site chama /api/search)"],
             ["GET", "/titles/{id}", "Um objeto título", "Reservado para uma futura página de detalhes"]],
            [0.11, 0.3, 0.2, 0.39], code_cols=(0, 1)),
      P("Exemplo da requisição que o back-end faz por você (com a configuração Bearer):", ParagraphStyle("ls", parent=small, keepWithNext=1)),
      C("""
GET https://api.seuprovedor.com/v1/titles
Accept: application/json
Authorization: Bearer abc123
""")]

s += [CondPageBreak(120 * mm), P("3.2 Formato de cada título", h2),
      P("<font face='Courier'>/titles</font> e <font face='Courier'>/titles/search</font> devem devolver um <b>array</b> "
        "(começando com <font face='Courier'>[</font>) de objetos neste formato:"),
      C("""
[
  {
    "id": 1,
    "title": "Horizonte de Vidro",
    "type": "filme",
    "year": 2026,
    "duration": "2h 14min",
    "ageRating": "14",
    "score": 9.1,
    "match": 98,
    "genres": ["Ficção Científica", "Drama"],
    "synopsis": "Quando uma cientista descobre que o céu...",
    "cast": ["Helena Prado", "Caio Monteiro"],
    "director": "Marina Albuquerque",
    "poster": "https://cdn.seuprovedor.com/posters/1.jpg",
    "backdrop": "https://cdn.seuprovedor.com/backdrops/1.jpg",
    "featured": true,
    "isNew": true,
    "progress": null
  }
]
""")]

s += [CondPageBreak(175 * mm), P("3.3 Campos", h2),
      table(["Campo", "Tipo", "Obrig.", "Regra / descrição"],
            [["id", "número ou texto", "Sim", "Único para cada título."],
             ["title", "texto", "Sim", "Nome exibido."],
             ["type", "texto", "Sim", 'Exatamente <font face="Courier">"filme"</font> ou <font face="Courier">"serie"</font> (sem acento). Define as abas Filmes e Séries.'],
             ["genres", "array de textos", "Sim", "Gera as fileiras e os filtros por gênero. Use [] se não houver."],
             ["cast", "array de textos", "Sim", "Elenco, mostrado nos detalhes. Use [] se não houver."],
             ["score", "<b>número</b>", "Sim", 'Nota de 0 a 10. Precisa ser número (9.1), não texto ("9.1").'],
             ["match", "número", "Sim", "Relevância de 0 a 100 (exibida como 98% relevante)."],
             ["year", "número", "Sim", "Ano de lançamento."],
             ["duration", "texto", "Sim", 'Livre: "2h 14min", "3 temporadas"...'],
             ["ageRating", "texto", "Sim", 'Um de: "L", "10", "12", "14", "16", "18" (define a cor do selo).'],
             ["synopsis", "texto", "Sim", "Sinopse."],
             ["director", "texto", "Sim", "Direção (filmes) ou criação (séries)."],
             ["poster", "URL ou null", "Não", "Imagem vertical (Top 10). Sem ela, o site gera uma arte."],
             ["backdrop", "URL ou null", "Não", "Imagem horizontal (cards, banner, detalhes)."],
             ["featured", "true/false", "Não", "Coloca o título no banner rotativo do topo."],
             ["isNew", "true/false", "Não", 'Mostra o selo "Novo" e entra em Lançamentos.'],
             ["progress", "número 0 a 1 ou null", "Não", "Progresso assistido (0.42 = 42%). Entra em Continue assistindo."]],
            [0.15, 0.19, 0.09, 0.57], code_cols=(0,))]

s += [P("3.4 Regras de resposta", h2)]
s += bullets([
    "Status <b>200</b> e cabeçalho <font face='Courier'>Content-Type: application/json</font>.",
    "As listas devem vir como <b>array direto</b>. Se a sua API embrulhar a lista, por exemplo "
    "<font face='Courier'>{\"results\": [...]}</font>, é preciso adaptar o código (seção 3.5).",
    "Os nomes dos campos são sensíveis a maiúsculas: <font face='Courier'>ageRating</font> é diferente de "
    "<font face='Courier'>agerating</font>.",
    "Erros de autenticação devem usar 401 ou 403. O back-end repassa o mesmo status para o site.",
    "O back-end espera no máximo <b>10 segundos</b> por resposta; depois disso devolve 502.",
    "Respostas acima de <b>5 MB</b>, que não sejam JSON ou que redirecionem para outro endereço são recusadas (502).",
])

s += [CondPageBreak(105 * mm), P("3.5 Se a sua API tiver outro formato", h2),
      P("Faça a conversão em <font face='Courier'>src/services/api.js</font>, sem mexer no resto do site. "
        "Exemplo para uma API que devolve <font face='Courier'>{\"results\": [...]}</font> com nomes em inglês:", lead),
      C("""
// src/services/api.js
const toTitle = (raw) => ({
  id: raw.id,
  title: raw.name,
  type: raw.kind === 'series' ? 'serie' : 'filme',
  year: Number(raw.release_year),
  duration: raw.runtime_label,
  ageRating: String(raw.rating ?? 'L'),
  score: Number(raw.vote_average ?? 0),
  match: Math.round((raw.vote_average ?? 0) * 10),
  genres: raw.genres ?? [],
  synopsis: raw.overview ?? '',
  cast: raw.cast ?? [],
  director: raw.director ?? '',
  poster: raw.poster_url ?? null,
  backdrop: raw.backdrop_url ?? null,
});

export const getCatalog = () =>
  request('/catalog').then((data) => data.results.map(toTitle));

export const searchTitles = (query) =>
  request(`/search?q=${encodeURIComponent(query)}`)
    .then((data) => data.results.map(toTitle));
"""),
      P("Se os caminhos da sua API forem outros (por exemplo <font face='Courier'>/movies</font> em vez de "
        "<font face='Courier'>/titles</font>), altere em <font face='Courier'>server/app.js</font> o texto passado para "
        "<font face='Courier'>proxyToApi(...)</font> nas rotas <font face='Courier'>/api/catalog</font> e "
        "<font face='Courier'>/api/search</font>, e inclua o novo caminho em <font face='Courier'>API_ALLOWED_PATHS</font>.")]

s += [CondPageBreak(90 * mm), P("4. Resultados esperados", h1),
      P("Depois dos 5 passos, confira cada item abaixo, nesta ordem.", lead)]

s += [P("4.1 No terminal", h2),
      P("Ao rodar <font face='Courier'>npm run dev:all</font>, as linhas marcadas como <b>[api]</b> devem mostrar:", lead),
      C("""
[api] [server] Back-end rodando em http://localhost:3001
[api] [server] Login (Supabase) configurado.
[api] [server] Chave da API carregada. Repassando -> https://api.seuprovedor.com/v1
"""),
      P("Se aparecer <font face='Courier'>API não configurada: usando o catálogo de demonstração</font>, o "
        "<font face='Courier'>API_BASE_URL</font> ou o <font face='Courier'>API_KEY</font> está vazio.", small)]

s += [P("4.2 No navegador: status do back-end", h2),
      P("Abra <font face='Courier'>http://localhost:5173/api/health</font>. O esperado é:", lead),
      C('{"ok":true,"login":true,"api":true}'),
      P("Este endereço nunca mostra chaves, só se elas foram carregadas.", small)]

s += [P("4.3 No navegador: dados da sua API", h2),
      P("Entre no site com um usuário liberado. Abra o <b>F12 &gt; Rede</b> e clique na chamada "
        "<font face='Courier'>catalog</font>: a resposta é o JSON da sua API, no formato da seção 3.2. "
        "Sem login, os endereços <font face='Courier'>/api/...</font> respondem 401, de propósito.")]

s += [CondPageBreak(75 * mm), P("4.4 No site", h2)]
s += bullets([
    "O selo amarelo <b>\"Modo demonstração · dados mockados\"</b> no canto inferior direito <b>desaparece</b>.",
    "O banner, as fileiras, o Top 10 e os filtros passam a mostrar os títulos da <b>sua</b> API.",
    "Títulos com <font face='Courier'>poster</font>/<font face='Courier'>backdrop</font> exibem as imagens reais; os demais continuam com a arte gerada.",
    "A busca do header passa a consultar <font face='Courier'>/titles/search</font> na sua API.",
    "No navegador (F12 > Rede), as chamadas aparecem como <font face='Courier'>/api/...</font> e <b>sem</b> a chave.",
])
s += [Spacer(1, 4),
      box("Pronto!", "Se os quatro testes acima passaram, a API está conectada e a chave está protegida no back-end.", OK_BG, OK_BD)]

s += [CondPageBreak(115 * mm), P("4.5 Problemas comuns", h2),
      P("Quando algo falha, o site mostra <i>\"Não foi possível carregar o catálogo\"</i> com o código do erro. Use a tabela:", lead),
      table(["Você vê", "Causa provável", "Como resolver"],
            [["Selo amarelo continua", "API_BASE_URL ou API_KEY vazio, ou o projeto não foi reiniciado.",
              "Preencha server/chave_api.env e rode npm run dev:all de novo."],
             ["Erro 503", "Chave/URL da API ou do Supabase vazia em server/chave_api.env.",
              "Preencha as variáveis indicadas na mensagem, salve e reinicie."],
             ["Erro 401 ou 403", "Chave inválida, expirada ou enviada no formato errado.",
              "Confira a chave e o passo 3 (cabeçalho, prefixo ou parâmetro)."],
             ["Erro 404", "Caminho fora de API_ALLOWED_PATHS, caminho diferente na sua API ou barra sobrando na URL base.",
              "Ajuste API_ALLOWED_PATHS e as rotas em server/app.js (seção 3.5); revise API_BASE_URL."],
             ["Erro 502", "API fora do ar, URL errada, resposta acima de 10 s ou 5 MB, ou que não é JSON.",
              "Teste a URL da API diretamente e confira API_BASE_URL."],
             ["Página em branco ou erro no console", "Formato do JSON diferente do esperado (ex.: lista embrulhada, score como texto).",
              "Veja a resposta em F12 > Rede > catalog, compare com a seção 3.2 e adapte com a seção 3.5."],
             ["Erro 405", "O site tentou um método diferente de GET.",
              "O back-end só permite leitura. Peça a liberação de outros métodos se precisar."],
             ["Erro 429", "Muitas requisições do mesmo IP em pouco tempo.",
              "Aguarde um minuto. O limite protege a sua cota contra abuso."]],
            [0.24, 0.38, 0.38])]

s += [P("5. Segurança", h1)]
s += bullets([
    "<font face='Courier'>server/chave_api.env</font> está no <font face='Courier'>.gitignore</font> e não vai para o GitHub. Não renomeie o arquivo.",
    "Nunca cole a chave em <font face='Courier'>src/</font>, no <font face='Courier'>.env</font> da raiz, no README ou em mensagens.",
    "Antes de cada <font face='Courier'>git push</font>, confira com <font face='Courier'>git status</font> que o arquivo da chave não aparece.",
    "Se a chave for publicada por engano, <b>gere uma chave nova</b> no provedor. Apagar o arquivo não basta: ela continua no histórico do Git.",
    "Na Vercel, as chaves não vão em arquivo: cadastre as mesmas variáveis em Settings > Environment Variables (veja o README).",
])

# ---------- build ----------
import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)
doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=16 * mm, bottomMargin=19 * mm,
                      title="Tutorial: conectando a sua API autorizada",
                      author=f"ANTONIO STREAMING PROJECT {VERSAO}",
                      subject="Uso da chave da API no projeto")
frame = Frame(M, 19 * mm, CW, H - 16 * mm - 19 * mm, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=on_page)])
doc.build(s)
print("OK", OUT)
