const isDigit = (code) => code >= 48 && code <= 57
const isIdentifierStart = (code) => code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 36 || code === 95
const isIdentifierChar = (code) => isIdentifierStart(code) || isDigit(code)
const isWhitespace = (code) => code >= 9 && code <= 13 || code === 32

export class Token {
  constructor(type, value) {
    this.type = type
    this.value = value
  }
}

export const TokenType = {
  END: {name: '<end>'},
  // Punctuators
  LBRACE:   {name: '{'},
  RBRACE:   {name: '}'},
  LBRACKET: {name: '['},
  RBRACKET: {name: ']'},
  LPAREN:   {name: '('},
  RPAREN:   {name: ')'},
  LT:       {name: '<'},
  GT:       {name: '>'},
  COLON:    {name: ':'},
  COMMA:    {name: ','},
  PERIOD:   {name: '.'},
  AMP:      {name: '&'},
  // Literals
  NUMBER: {name: 'number'},
  STRING: {name: 'string'},
  // Specials
  IDENTIFIER: {name: 'identifier'},
  // Keywords
  NULL:  {name: 'null'},
  TRUE:  {name: 'true'},
  FALSE: {name: 'false'},
}

export class GraphQLError extends SyntaxError {
  constructor(line, column, message) {
    super(`[${line}:${column}] ${message}`)
    this.line = line
    this.column = column
  }
}

export default class Tokenizer {
  constructor(source) {
    this.source = source
    this.pos = 0
    this.line = 1
    this.lineStart = 0
    this.lookahead = null
  }

  end() {
    return this.lookahead.type === TokenType.END
  }

  next() {
    this._skipWhitespaces()

    // End of input
    if (this.pos >= this.source.length) {
      return new Token(TokenType.END)
    }

    const ch = this.source.charAt(this.pos)

    // Identifiers
    if (isIdentifierStart(ch.charCodeAt(0))) {
      return this._scanIdentifier()
    }

    switch (ch) {
      // Punctuations
      case '{': this.pos++; return new Token(TokenType.LBRACE, ch)
      case '}': this.pos++; return new Token(TokenType.RBRACE, ch)
      case '[': this.pos++; return new Token(TokenType.LBRACKET, ch)
      case ']': this.pos++; return new Token(TokenType.RBRACKET, ch)
      case '(': this.pos++; return new Token(TokenType.LPAREN, ch)
      case ')': this.pos++; return new Token(TokenType.RPAREN, ch)
      case '<': this.pos++; return new Token(TokenType.LT, ch)
      case '>': this.pos++; return new Token(TokenType.GT, ch)
      case ':': this.pos++; return new Token(TokenType.COLON, ch)
      case ',': this.pos++; return new Token(TokenType.COMMA, ch)
      case '.': this.pos++; return new Token(TokenType.PERIOD, ch)
      case '&': this.pos++; return new Token(TokenType.AMP, ch)

      // Strings
      case '"':
        return this._scanString()

      // Numbers
      case '-':
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        return this._scanNumber()
    }

    throw this.createIllegal()
  }

  _fromJSON(json) {
    try {
      return JSON.parse(json)
    } catch (err) {
      throw this.createIllegal()
    }
  }

  _scanIdentifier() {
    const start = this.pos
    while (isIdentifierChar(this.source.charCodeAt(this.pos))) {
      this.pos++
    }

    const name = this.source.slice(start, this.pos)

    // Keywords
    switch (name) {
      case 'null': return new Token(TokenType.NULL, name)
      case 'true': return new Token(TokenType.TRUE, name)
      case 'false': return new Token(TokenType.FALSE, name)
    }

    // Identifier
    return new Token(TokenType.IDENTIFIER, name)
  }

  _scanNumber() {
    const start = this.pos

    if (this.source.charAt(this.pos) === '-') {
      this.pos++
    }

    this._skipInteger()

    if (this.source.charAt(this.pos) === '.') {
      this.pos++
      this._skipInteger()
    }

    let ch = this.source.charAt(this.pos)
    if (ch === 'e' || ch === 'E') {
      this.pos++

      ch = this.source.charAt(this.pos)
      if (ch === '+' || ch === '-') {
        this.pos++
      }

      this._skipInteger()
    }

    const slice = this.source.slice(start, this.pos)
    const value = this._fromJSON(slice)

    return new Token(TokenType.NUMBER, value)
  }

  _scanString() {
    const start = ++this.pos
    while (this.pos < this.source.length) {
      const ch = this.source.charAt(this.pos)
      if (ch === '"') {
        return new Token(TokenType.STRING, this.source.slice(start, this.pos++))
      }

      this.pos++
    }

    throw this.createIllegal()
  }

  _skipInteger() {
    const start = this.pos
    while (this.pos < this.source.length) {
      const code = this.source.charCodeAt(this.pos)
      if (isDigit(code)) {
        this.pos++
      } else {
        break
      }
    }

    if (this.pos - start === 0) {
      throw this.createIllegal()
    }
  }

  _skipWhitespaces() {
    while (this.pos < this.source.length) {
      let code = this.source.charCodeAt(this.pos)
      if (isWhitespace(code)) {
        this.pos++
        if (code === 10) {
          this.line++
          this.lineStart = this.pos
        }
      } else {
        break
      }
    }
  }

  lex() {
    const prev = this.lookahead
    this.lookahead = this.next()
    return prev
  }

  createError(message) {
    return new GraphQLError(this.line, this.pos - this.lineStart + 1, message)
  }

  createIllegal() {
    return this.pos < this.source.length
      ? this.createError(`Unexpected ${this.source.charAt(this.pos)}`)
      : this.createError('Unexpected end of input')
  }

  createUnexpected(token) {
    return this.createError(`Unexpected token ${token.type.name}`)
  }
}
