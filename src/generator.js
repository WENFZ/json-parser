function generate(ast) {
  const strs = [];
  let cnt = 0;

  function indent() {
    cnt++;
  }

  function outdent() {
    cnt--;
  }

  function printIdent() {
    for (let i = 0; i < cnt; i++) {
      strs.push("  ");
    }
  }

  function printNullLiteral() {
    strs.push("null");
  }

  function printBoolLiteral(node) {
    if (node.value) {
      strs.push("true");
    } else {
      strs.push("false");
    }
  }

  function printNumberLiteral(node) {
    strs.push(`${node.value}`);
  }

  function printStringLiteral(node) {
    strs.push(`"${node.value}"`);
  }

  function printLiteral(node) {
    const map = {
      NullLiteral: printNullLiteral,
      NumberLiteral: printNumberLiteral,
      StringLiteral: printStringLiteral,
      BoolLiteral: printBoolLiteral,
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

  function printKey(node) {
    strs.push(`"${node.value}"`);
  }

  function printProperty(node) {
    printKey(node.key);
    strs.push(": ");
    printValue(node.value);
  }

  function printObject(node) {
    strs.push("{");
    strs.push("\n");
    indent();
    const properties = node.properties;
    properties.forEach((property, idx) => {
      printIdent();
      printProperty(property);
      if (idx !== strs.length - 1) {
        strs.push(",");
        strs.push("\n");
      }
    });
    outdent();
    printIdent();
    strs.push("}");
  }

  function printArray(node) {
    strs.push("[");
    strs.push("\n");
    indent();
    const elements = node.elements;
    elements.forEach((element, idx) => {
      printIdent();
      printValue(element);
      if (idx !== strs.length - 1) {
        strs.push(",");
        strs.push("\n");
      }
    });
    outdent();
    printIdent();
    strs.push("]");
  }

  function printValue(node) {
    if (node.type === "Array") {
      printArray(node);
      return;
    }
    if (node.type === "Object") {
      printObject(node);
      return;
    }
    printLiteral(node);
  }

  printValue(ast);
  const result = strs.join("");
  return result;
}

module.exports = {
  generate,
};
