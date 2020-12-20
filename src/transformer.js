function transform(ast, visitors) {
  function customVisit(node, type) {
    const visit = visitors[type];
    if (typeof visit === "function") {
      visit(node);
    }
  }

  function visitNullLiteral(node) {
    customVisit(node, "NullLiteral");
  }

  function visitNumberLiteral(node) {
    customVisit(node, "NumberLiteral");
  }

  function visitStringLiteral(node) {
    customVisit(node, "StringLiteral");
  }

  function visitBoolLiteral(node) {
    customVisit(node, "BoolLiteral");
  }

  function visitLiteral(node) {
    const map = {
      NullLiteral: visitNullLiteral,
      NumberLiteral: visitNumberLiteral,
      StringLiteral: visitStringLiteral,
      BoolLiteral: visitBoolLiteral,
    };
    const visit = map[node.type];
    if (typeof visit === "function") {
      visit(node);
    } else {
      throw new Error(
        `unexpected literal type ${JSON.stringify(
          node,
          null,
          2
        )}, should be one of ${JSON.stringify(Object.keys(map))}`
      );
    }
  }

  function visitKey(node) {
    customVisit(node, "Key");
  }

  function visitProperty(node) {
    customVisit(node, "Property");
    const key = node.key;
    visitKey(key);
    const value = node.value;
    visitValue(value);
  }

  function visitObject(node) {
    customVisit(node, "Object");
    const properties = node.properties;
    properties.forEach((property) => {
      visitProperty(property);
    });
  }

  function visitArray(node) {
    customVisit(node, "Array");
    const elements = node.elements;
    elements.forEach((element) => {
      visitValue(element);
    });
  }

  function visitValue(node) {
    if (node.type === "Array") {
      visitArray(node);
      return;
    }
    if (node.type === "Object") {
      visitObject(node);
      return;
    }
    visitLiteral(node);
  }

  visitValue(ast);
}

function runPlugins(ast,plugins){
  plugins.forEach(plugin=>{
    transform(ast,plugin);
  })
  return ast;
}

module.exports = {
  transform,runPlugins
};
