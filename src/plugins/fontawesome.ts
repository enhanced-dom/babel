import * as BabelTypes from '@babel/types'
import { Visitor } from '@babel/traverse'

const isFontawesomeIconImport = (node: BabelTypes.ImportDeclaration) =>
  node.source.value.startsWith('@fortawesome/') && node.source.value.endsWith('-svg-icons')

const replaceImport = (specifier: BabelTypes.ImportSpecifier, types: typeof BabelTypes, importName: string) => {
  const name = types.isStringLiteral(specifier.imported) ? specifier.imported.value : specifier.imported.name
  return types.importDeclaration(
    [types.importSpecifier(types.identifier(name), types.identifier('definition'))],
    types.stringLiteral(`${importName}/${name}`),
  )
}

export = ({ types }: { types: typeof BabelTypes }): { visitor: Visitor } => {
  return {
    visitor: {
      ImportDeclaration(path) {
        const { node } = path
        if (isFontawesomeIconImport(node)) {
          const transformedNodes = node.specifiers
            .map((spec) => {
              if (types.isImportSpecifier(spec)) {
                return replaceImport(spec, types, node.source.value)
              }
              return spec
            })
            .filter((newSpecifier) => !!newSpecifier)
          path.replaceWithMultiple(transformedNodes)
        }
      },
    },
  }
}
