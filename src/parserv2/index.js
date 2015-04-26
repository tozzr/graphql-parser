class Token {
  constructor(type, value) {
    this.type = type
    this.value = value
  }
}

const TokenType = {
  EOS: {name: '<end>'},
  // Punctuators
  LBRACE: {name: '{'},
  RBRACE: {name: '}'},
  LPAREN: {name: '('},
  RPAREN: {name: ')'},
  LT: {name: '<'},
  GT: {name: '>'},
  COMMA: {name: ','},
  PERIOD: {name: '.'},
  REF: {name: '&'},
  // Literals
  ARRAY: {name: 'array'},
  OBJECT: {name: 'object'},
  NUMBER: {name: 'number'},
  STRING: {name: 'string'},
  // Keywords
  NULL: {name: 'null'},
  TRUE: {name: 'true'},
  FALSE: {name: 'false'},
}

class Parser {
  parseQuery() {
    this.parseField()
  }

  parseIdentifier() {
    if (this.match(TokenType.IDENTIFIER)) {
      return this.lex().value
    }

    throw new this.createUnexpected(this.lookahead)
  }

  parseLiteral() {
    const raw = this.lex().value
    return {type: 'Literal', raw, cooked: JSON.parse(raw)}
  }

  parseParameter() {
    this.expect(TokenType.LT)
    const name = this.parseIdentifier()
    this.expect(TokenType.GT)
    return {type: 'Parameter', name}
  }

  parseArgument() {
    switch (this.lookahead.type) {
      case TokenType.NUMBER:
      case TokenType.STRING:
      case TokenType.ARRAY:
      case TokenType.OBJECT:
      case TokenType.TRUE:
      case TokenType.FALSE:
      case TokenType.NULL:
        return this.parseLiteral()

      case TokenType.LT:
        return this.parseParameter()
    }

    throw this.createUnexpected(this.lookahead)
  }

  parseArguments() {
    const args = []

    this.expect(TokenType.LPAREN)

    while (!this.match(TokenType.RBRACE) || !this.eof()) {
      args.push(this.parseArgument())
      if (!this.eat(TokenType.COMMA)) {
        break
      }
    }

    this.expect(TokenType.RBRACE)

    return args
  }

  parseCallExpression() {
    this.expect(TokenType.PERIOD)

    const callee = this.parseIdentifier()
    const args = this.parseArguments()

    return {type: 'CallExpression', callee, arguments: args}
  }

  parseCallExpresions() {
    const calls = []

    while (this.match(TokenType.PERIOD)) {
      calls.push(this.parseCallExpression())
    }

    return calls
  }

  parseField() {
    const id = this.parseIdentifier()
    const calls = this.parseCallExpresions()
    const body = this.parseFieldBody()
  }

  parseFieldBody() {
    this.expect(TokenType.LBRACE)
    this.expect(TokenType.RBRACE)
  }
}
