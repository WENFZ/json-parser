const code = `
    {
        "str_key": "hello",
        "num_key": 0,
        "bool_key": true,
        "null_key": null,
        "arr_key": [1,2,3],
        "obj_key": {
            "str_key": "world",
            "num_key": 1,
            "bool_key": false,
            "null_key": null,
            "arr_key": [1,2,3],
        }
    }
`;

const metas = [
  {
    type: "BoolLiteral",
    pattern: /^(true|false)/,
  },
  {
    type: "NullLiteral",
    pattern: /^(null)/,
  },
  {
    type: "NumberLiteral",
    pattern: /^(-?\d*\.?\d+)/,
  },
  {
    type: "StringLiteral",
    pattern: /^(".*?")/,
  },
  {
    type: "Symbol",
    pattern: /^(\[|]|\(|\)|\{|}|,|:)/,
  },
  {
    type: "Whitespace",
    pattern: /^(\s+)/,
  },
];
function tokenize(code) {
  const tokens = [];
  let rest = code;
  let lastRest = rest;
  while (rest !== "") {
    lastRest = rest;
    for (let i = 0; i < metas.length; i++) {
      const { type, pattern } = metas[i];
      const extracted = rest.match(pattern);
      if (extracted && extracted[1] !== "") {
        tokens.push({
          type,
          value: extracted[1],
        });
        rest = rest.substr(extracted[1].length);
        break;
      }
    }
    if (lastRest === rest) {
      throw new Error(`unknown token starts with ${rest}`);
    }
  }
  tokens.push({
    type: "EOF",
  });
  return tokens;
}

const tokens = tokenize(code).filter((token) => token.type !== "Whitespace");
console.log(tokens);

/*
 * value => literal | array | object
 * literal => NullLiteral|NumberLiteral|BoolLiteral|StringLiteral
 * array => [valueList]
 * valueList => value,valueList | epsilon
 * object => {propertyList}
 * propertyList => property,propertyList | epsilon
 * property => key:value
 * key => StringLiteral
 * */
function parse(tokens) {
  let pos = 0;

  function is(type, value) {
    const token = tokens[pos];
    return type === token.type && (value ? value === token.value : true);
  }

  function expect(type, value) {
    if (is(type, value)) {
      pos++;
      return;
    }

    throw new Error(
      `expect ${JSON.stringify({ type, value })}, got ${JSON.stringify(cur())}`
    );
  }

  function next() {
    return tokens[pos++];
  }

  function cur() {
    return tokens[pos];
  }

  function parseValue() {
    if (is("Symbol", "[")) {
      return parseArray();
    }

    if (is("Symbol", "{")) {
      return parseObject();
    }

    return parseLiteral();
  }

  function parseLiteral() {
    if (is("NumberLiteral")) {
      const token = cur();
      next();
      return {
        type: "NumberLiteral",
        value: parseFloat(token.value),
      };
    }

    if (is("NullLiteral")) {
      next();
      return {
        type: "NullLiteral",
        value: null,
      };
    }

    if (is("BoolLiteral")) {
      const token = cur();
      next();
      return {
        type: "BoolLiteral",
        value: token.value === "true",
      };
    }

    if (is("StringLiteral")) {
      const token = cur();
      next();
      return {
        type: "StringLiteral",
        value: token.value.slice(1, -1),
      };
    }

    throw new Error(
      `expect [NumberLiteral,NullLiteral,BoolLiteral,StringLiteral], but got ${
        cur().value
      }`
    );
  }

  function parseArray() {
    expect("Symbol", "[");
    const elements = [];
    while (!is("Symbol", "]")) {
      const element = parseValue();
      elements.push(element);
      if (is("Symbol", ",")) {
        next();
      }
    }
    expect("Symbol", "]");
    return {
      type: "Array",
      elements,
    };
  }

  function parseKey(){
    const keyToken = cur();
    expect("StringLiteral");
    return {
        type:'Key',
        value:keyToken.value.slice(1,-1),
    };
  }

  function parseProperty() {
    const key = parseKey();
    expect("Symbol", ":");
    const value = parseValue();
    return {
      type: "Property",
      key,
      value,
    };
  }

  function parseObject() {
    expect("Symbol", "{");
    const properties = [];
    while (!is("Symbol", "}")) {
      const property = parseProperty();
      properties.push(property);
      if (is("Symbol", ",")) {
        next();
      }
    }
    expect("Symbol", "}");
    return {
      type: "Object",
      properties,
    };
  }

  const value = parseValue();
  expect("EOF");
  return value;
}

const ast = parse(tokens);
console.log(JSON.stringify(ast, null, 2));

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

transform(ast, {
  BoolLiteral(node) {
    node.value = !node.value;
  },
  NumberLiteral(node) {
    node.value = node.value + 5;
  },
});

console.log(JSON.stringify(ast, null, 2));

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

const result = generate(ast);
console.log(result);
