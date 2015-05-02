import Tokenizer, {TokenType} from './tokenizer'

export default class Parser extends Tokenizer {
  match(type) {
    return this.lookahead.type === type
  }

  eat(type) {
    if (this.match(type)) {
      return this.lex()
    }
  }

  expect(type) {
    const token = this.eat(type)
    if (!token) {
      throw this.createUnexpected(this.lookahead)
    }

    return token
  }

  parseQuery() {
    this.lookahead = this.next()
    return this.parseField()
  }

  parseIdentifier() {
    if (this.match(TokenType.IDENTIFIER)) {
      return this.lex().value
    }

    throw this.createUnexpected(this.lookahead)
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
    const name = this.parseIdentifier()
    const calls = this.parseCallExpresions()
    const fields = this.parseFieldBody()

    return {type: 'Field', name, calls, fields}
  }

  parseFieldBody() {
    const fields = []

    this.expect(TokenType.LBRACE)

    while (!this.eat(TokenType.RBRACE)) {
      fields.push(this.parseField())
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA)
      }
    }

    return fields
  }
}

const p = new Parser(`
  viewer {
    id {}
  }
`)

console.log(p.parseQuery())
