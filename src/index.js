import parse from './parser'
import transform from './transform'
import Transformer from './transform/transformer'
import * as GraphQL from 'graphql-types'
import * as types from './types'

export { parse, GraphQL, Transformer, types }

export function concat(strings) {
  let source = strings[0] || ''
  for (let i = 1; i < strings.length; i++) {
    source += `&${ i - 1 }`
    source += strings[i]
  }

  return source
}

export default function graphql(strings, ...args) {
  const source = concat(strings)
  const ast = parse(source)

  return (params) => {
    const state = {
      arguments: args,
      variables: params,
    }

    return transform(ast, state)
  }
}

graphql.GraphQL = GraphQL
