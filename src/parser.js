/*
 * value => literal | array | object
 * literal => NullLiteral | NumberLiteral | BoolLiteral | StringLiteral
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

  function parseKey() {
    const keyToken = cur();
    expect("StringLiteral");
    return {
      type: "Key",
      value: keyToken.value.slice(1, -1),
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
module.exports = {
  parse,
};
