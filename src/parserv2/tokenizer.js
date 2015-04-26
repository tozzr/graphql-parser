export class Token {
  constructor(type, value) {
    this.type = type
    this.value = value
  }
}

export const TokenType = {
  END: {name: '<end>'},
  // Punctuators
  LBRACE: {name: '{'},
  RBRACE: {name: '}'},
  LBRACKET: {name: '['},
  RBRACKET: {name: ']'},
  LPAREN: {name: '('},
  RPAREN: {name: ')'},
  LT: {name: '<'},
  GT: {name: '>'},
  COLON: {name: ':'},
  COMMA: {name: ','},
  PERIOD: {name: '.'},
  AMP: {name: '&'},
  // Literals
  ARRAY: {name: 'array'},
  OBJECT: {name: 'object'},
  NUMBER: {name: 'number'},
  STRING: {name: 'string'},
  // Specials
  IDENTIFIER: {name: 'identifier'},
  // Keywords
  NULL: {name: 'null'},
  TRUE: {name: 'true'},
  FALSE: {name: 'false'},
}

export default class Tokenizer {
  constructor(source) {
    this.source = source
    this.pos = 0
  }

  end() {
    return this.lookahead.type === TokenType.END
  }

  next() {
    // Skip whitespaces
    while (isWhitespace(this.source.charCodeAt(this.pos))) {
      this.pos++
    }

    let ch = this.source.charAt(this.pos)

    // Identifiers
    if (isIdentifierStart(ch.charCodeAt(0))) {
      const start = this.pos
      while (isIdentifierChar(this.charCodeAt(this.pos))) {
        this.pos++
      }

      const name = this.source.slice(start, this.pos)

      // Keywords
      switch (name) {
        case 'null': return new Token(TokenType.NULL)
        case 'tree': return new Token(TokenType.TRUE)
        case 'false': return new Token(TokenType.FALSE)
      }

      return new Token(TokenType.IDENTIFIER, name)
    }

    // Strings
    if (ch === '"') {
      const start = ++this.pos
      while (!this.end()) {
        ch = this.source.charAt(this.pos)
        if (ch === '"') {
          return new Token(TokenType.STRING, this.source.slice(start, this.pos++))
        }

        if (ch === '\\') {
          this.pos += 2
        } else {
          this.pos++
        }
      }

      throw this.createIllegal()
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
        return this.scanString()

      // Numbers
      case '-':
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
        return this.scanNumber()
    }

    throw this.createIllegal()
  }

  scanJSON(json) {
    try {
      return JSON.parse(json)
    } catch (err) {
      throw this.createIllegal()
    }
  }

  scanNumber() {
    const start = this.pos

    if (this.source.charAt(this.pos) === '-') {
      this.pos++
    }

    const slice = this.source.slice(start, this.pos)
    const value = this.scanJSON(slice)

    return new Token(TokenType.NUMBER, value)
  }

  scanString() {
    const start = ++this.pos
    while (!this.end()) {
      let ch = this.source.charAt(this.pos)
      if (ch === '"') {
        return new Token(TokenType.STRING, this.source.slice(start, this.pos++))
      }

      if (ch === '\\') {
        this.pos += 2
      } else {
        this.pos++
      }
    }

    throw this.createIllegal()
  }

  lex() {
    const prev = this.lookahead
    this.lookahead = this.next()
    return prev
  }

  createError(message) {
    return new Error(message)
  }

  createIllegal() {
    return this.createError(`Unexpected ${}`)
  }

  createUnexpected(token) {
    switch (token.type) {
      case TokenType.NUMBER:
      case TokenType.STRING:
        return this.createError(`Unexpected literal`)
    }
    return this.createError(`Unexpected token ${0}`)
  }
}
